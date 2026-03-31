import logging
import discord
from discord.ext import commands
from typing import List, Dict, Any, Optional
from lib.page import PaginationView
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

        def chunk_list(lst, n):
            for i in range(0, len(lst), n):
                yield lst[i:i + n]

        achievement_chunks = list(chunk_list(all_achievements, 5))
        embed_list = []

        for i, chunk in enumerate(achievement_chunks):
            embed = discord.Embed(
                title=f"🏆 {interaction.user.display_name} の実績一覧",
                description=f"現在の進捗状況です ({i+1}/{len(achievement_chunks)}ページ)",
                color=discord.Color.gold()
            )

            for ach in chunk:
                ach_id = ach.get('id')
                progress = progress_map.get(ach_id, {})
                current_val = progress.get('current_value', 0)
                
                steps = ach.get("steps", [])
                if not steps: continue

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
            
            embed_list.append(embed)

        if len(embed_list) <= 1:
            return await interaction.followup.send(embed=embed_list[0])

        view = PaginationView(embeds=embed_list)
        view.page_indicator.label = f"1 / {len(embed_list)}"
        view.first_page.disabled = True
        view.prev_page.disabled = True
        
        await interaction.followup.send(embed=embed_list[0], view=view)

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

        # 1. モジュール有効化チェック
        is_enabled_data = await client.is_module_enabled(guild_id, "achievements")
        if not is_enabled_data or not is_enabled_data.get('enabled'):
            return

        # 2. 全実績リストを取得
        raw_achievements = await client.get_achievement_list(guild_id)
        parsed_achievements = self.parse_achievements(raw_achievements)
        target_achievements = parsed_achievements.get(ach_type, [])

        if not target_achievements:
            return

        # 3. ユーザーの現在の進捗を辞書化して取得
        user_progress_list = await client.get_achievements_user_progress(guild_id, user_id)
        progress_map = {p['achievement_id']: p for p in user_progress_list}

        for ach in target_achievements:
            ach_id = ach.get('id')
            progress = progress_map.get(ach_id, {})

            # すでに全段階クリア済みの場合は何もしない
            if progress.get('is_completed'):
                continue

            # 現在のDB上の値を取得
            old_val = progress.get('current_value', 0)
            # 今回の更新後の値
            new_val = old_val + 1
            # 最後に達成済みのステップ番号 (未達成は -1)
            last_order = progress.get('last_step_order', -1)
            
            steps = ach.get('steps', [])
            if not steps:
                continue

            # 閾値順にソート
            sorted_steps = sorted(steps, key=lambda x: int(x.get('threshold', 0)))
            
            new_step_reached = None
            current_last_order = last_order

            next_order = last_order + 1

            if next_order < len(sorted_steps):
                target_step = sorted_steps[next_order]
                threshold = int(target_step.get('threshold', 0))

                if new_val >= threshold and old_val < threshold:
                    new_step_reached = target_step
                    current_last_order = next_order

            # 最終ステップまで到達したか
            is_completed = (current_last_order == len(sorted_steps) - 1)
            
            # DBを更新（通知の有無に関わらずカウントは進める）
            await client.update_achievements_user_progress(
                guild_id, user_id, ach_id, new_val,
                is_completed=is_completed,
                last_step_order=current_last_order 
            )

            # 新しくステップを達成した「その瞬間」だけ通知を飛ばす
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