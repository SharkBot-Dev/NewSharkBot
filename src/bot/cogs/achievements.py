import logging
import discord
from discord.ext import commands
from typing import List, Dict, Any, Optional
from main import NewSharkBot
from lib.command import Command

class AchievementCog(commands.Cog):
    def __init__(self, bot: NewSharkBot):
        self.bot = bot
        achievements = Command(name="achievements", description="実績を確認します。", module_name="実績")
        achievements.execute = self.achievements_command
        self.bot.add_slashcommand(achievements)

    async def achievements_command(self, interaction: discord.Interaction, **kwargs):
        await interaction.response.defer()
        
        guild_id = str(interaction.guild_id)
        user_id = str(interaction.user.id)

        try:
            all_achievements = await self.bot.api.get_achievement_list(guild_id) 
            user_progress_list = await self.bot.api.get_achievements_user_progress(guild_id, user_id)
            progress_map = {p['achievement_id']: p for p in user_progress_list} if user_progress_list else {}
        except Exception as e:
            logging.error(f"Achievement API Error: {e}")
            return await interaction.followup.send("データの取得中にエラーが発生しました。")

        if not all_achievements:
            return await interaction.followup.send("このサーバーにはまだ実績が設定されていません。")

        embed = discord.Embed(
            title=f"🏆 {interaction.user.display_name} の実績一覧",
            description="現在の進捗状況です。",
            color=discord.Color.gold()
        )

        for ach in all_achievements:
            ach_id = ach.get('id')
            progress = progress_map.get(ach_id, {})
            current_val = progress.get('current_value', 0)
            
            steps = ach.get("steps", [])
            if not steps:
                continue

            sorted_steps = sorted(steps, key=lambda x: x.get("threshold", 0))
            
            achieved_step = None
            next_step = None
            for step in sorted_steps:
                if current_val >= step.get("threshold", 0):
                    achieved_step = step
                else:
                    next_step = step
                    break
            
            status_text = f"✅ **{achieved_step['name']}** 達成中！" if achieved_step else "❌ 未達成"

            if next_step:
                target = next_step.get("threshold", 1)
                percent = min(current_val / target, 1.0) if target > 0 else 0
                bar_count = int(percent * 10)
                progress_bar = "🟦" * bar_count + "⬜" * (10 - bar_count)
                status_text += f"\n`{progress_bar}` {current_val}/{target} (次は: **{next_step['name']}**)"
            else:
                status_text += "\n`🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦` (全段階コンプリート！)"

            embed.add_field(name=f"✨ {ach.get('name', '実績')}", value=status_text, inline=False)

        await interaction.followup.send(embed=embed)

    def parse_achievements(self, raw_data: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
        parsed: Dict[str, List[Dict[str, Any]]] = {}
        for ach in raw_data:
            ach_type = ach.get("type", "unknown")
            if ach_type not in parsed:
                parsed[ach_type] = []
            if "steps" in ach and ach["steps"]:
                ach["steps"] = sorted(ach["steps"], key=lambda x: x.get("threshold", 0))
            parsed[ach_type].append(ach)
        return parsed

    async def update_user_achievement_progress(self, guild: discord.Guild, member: discord.Member, ach_type: str, trigger_message: Optional[discord.Message] = None):
        guild_id = str(guild.id)
        user_id = str(member.id)
        client = self.bot.api

        is_enabled_data = await client.is_module_enabled(guild_id, "achievements")
        if not is_enabled_data or not is_enabled_data.get('enabled'):
            return

        raw_achievements = await client.get_achievement_list(guild_id)
        parsed_achievements = self.parse_achievements(raw_achievements)
        target_achievements = parsed_achievements.get(ach_type, [])

        if not target_achievements:
            return

        user_progress_list = await client.get_achievements_user_progress(guild_id, user_id)

        for ach in target_achievements:
            ach_id = ach.get('id')
            progress = next((p for p in user_progress_list if p.get('achievement_id') == ach_id), None)
            if progress and progress.get('is_completed'):
                continue

            current_val = (progress['current_value'] if progress else 0) + 1
            last_order = progress.get('last_step_order', -1) if progress else -1
            
            steps = ach.get('steps', [])
            new_step_reached = None
            new_last_order = last_order

            for i, step in enumerate(steps):
                threshold = int(step.get('threshold', 0))
                if i > last_order and current_val >= threshold:
                    new_step_reached = step
                    new_last_order = i

            is_completed = (new_last_order == len(steps) - 1) if steps else False
            
            await client.update_achievements_user_progress(
                guild_id, user_id, ach_id, current_val,
                is_completed=is_completed,
                last_step_order=new_last_order 
            )

            if new_step_reached:
                await self.dispatch_achievement_reward(guild, member, ach, new_step_reached)

    @commands.Cog.listener()
    async def on_message(self, message: discord.Message):
        if message.author.bot or not message.guild:
            return
        await self.update_user_achievement_progress(message.guild, message.author, "messages")

    @commands.Cog.listener()
    async def on_raw_reaction_add(self, payload: discord.RawReactionActionEvent):
        if payload.member is None or payload.member.bot:
            return
        
        guild = self.bot.get_guild(payload.guild_id)
        if not guild:
            return

        await self.update_user_achievement_progress(guild, payload.member, "reactions")

    async def dispatch_achievement_reward(self, guild: discord.Guild, member: discord.Member, achievement: dict, step: dict):
        if step.get('reward_role_id'):
            role = guild.get_role(int(step['reward_role_id']))
            if role and role not in member.roles:
                try:
                    await member.add_roles(role, reason=f"Achievement Unlocked: {achievement['name']}")
                except discord.Forbidden:
                    logging.error(f"[Achievement] Forbidden: Cannot add role {role.name} in {guild.name}")

        settings_data = await self.bot.api.get_achievements_settings(str(guild.id))
        settings = settings_data if settings_data else {}
        
        if not settings.get('is_notify_enabled') or not settings.get('notify_channel_id'):
            return

        channel = guild.get_channel(int(settings['notify_channel_id']))
        if not channel:
            return

        placeholders = {
            "ユーザー名": member.display_name,
            "ユーザーID": member.id,
            "メンション": member.mention,
            "実績名": achievement.get('name', '不明'),
            "ステップ名": step.get('name', '不明'),
            "必要な数値": step.get('threshold', 0)
        }

        content = None
        if settings.get('content'):
            try:
                content = settings['content'].format(**placeholders)
            except KeyError:
                content = settings['content']

        embed = None
        if settings.get('embed_id'):
            raw_data = await self.bot.embed.getEmbed(settings['embed_id'])
            if raw_data:
                target_embed = discord.Embed.from_dict(raw_data) if isinstance(raw_data, dict) else raw_data
                embed = self.bot.embed._apply_placeholders_to_embed(target_embed, placeholders)

        if content or embed:
            await channel.send(content=content, embed=embed)

async def setup(bot):
    await bot.add_cog(AchievementCog(bot))