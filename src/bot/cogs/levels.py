import asyncio
import copy
import io
import logging
import time

import aiohttp
from discord.ext import commands
import random
import discord

from lib.command import Command
from main import NewSharkBot

class LevelUtils:
    @staticmethod
    def get_total_xp_for_level(level: int) -> int:
        if level <= 1: return 0
        total = 0
        for i in range(1, level):
            total += 5 * (i ** 2) + 50 * i + 100
        return total

    @staticmethod
    def get_level_from_total_xp(total_xp: int) -> int:
        if total_xp <= 0: return 1
        
        lvl = 1
        while True:
            required = LevelUtils.get_total_xp_for_level(lvl + 1)
            if total_xp < required:
                break
            lvl += 1
        return lvl

class LevelsCog(commands.Cog):
    def __init__(self, bot: NewSharkBot):
        self.bot = bot
        self.cooldowns = {}

        rank = Command(name="rank", description="ユーザーのランクを表示します。", module_name="レベル")
        rank.execute = self.rank_command
        self.bot.add_slashcommand(rank)
    
        levels = Command(name="levels", description="レベルのランキングを表示します。", module_name="レベル")
        levels.execute = self.levels_command
        self.bot.add_slashcommand(levels)

        give_xp = Command(name="give-xp", description="ユーザーにXPを追加します。", module_name="レベル")
        give_xp.execute = self.give_xp_command
        self.bot.add_slashcommand(give_xp)

        remove_xp = Command(name="remove-xp", description="ユーザーからXPを剥奪します。", module_name="レベル")
        remove_xp.execute = self.remove_xp_command
        self.bot.add_slashcommand(remove_xp)

        print("init -> LevelsCog")

    def process_string(self, text, limit=15, suffix="..."):
        if len(text) > limit:
            return text[:limit] + suffix
        return text

    async def rank_command(self, interaction: discord.Interaction, **kwargs):
        if not self.bot.api:
            return
        
        await interaction.response.defer()
        
        user_id = kwargs.get("user", None)
        user = interaction.user
        if user_id:
            user = interaction.guild.get_member(int(user_id))
            if not user:
                return await interaction.followup.send(content="ユーザーが見つかりませんでした。")

        guild_id = str(interaction.guild.id)
        data = await self.bot.api.get_user_level(guild_id, str(user.id))

        if not data or 'xp' not in data:
            return await interaction.followup.send(content="ユーザーのランクが見つかりませんでした。")
        
        total_xp = data['xp']
        current_level = LevelUtils.get_level_from_total_xp(total_xp)
        
        xp_at_start_of_level = LevelUtils.get_total_xp_for_level(current_level)

        xp_at_start_of_next_level = LevelUtils.get_total_xp_for_level(current_level + 1)
        
        display_current_xp = total_xp - xp_at_start_of_level
        display_max_xp = xp_at_start_of_next_level - xp_at_start_of_level

        image_api_url = "http://images:8000/levels/rank"
        
        params = {
            "name": self.process_string(user.name),
            "level": current_level,
            "current_xp": display_current_xp,
            "max_xp": display_max_xp,
            "avatar_url": str(user.display_avatar.url),
            "status": str(user.status)
        }

        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(image_api_url, params=params, timeout=10) as response:
                    if response.status == 200:
                        content = await response.read()
                        byte = io.BytesIO(content)
                        image_file = discord.File(byte, filename="rank_card.png")
                        await interaction.followup.send(file=image_file)

                        byte.close()
                    else:
                        print(f"API Error: {response.status}")
                        await interaction.followup.send(content="画像の生成に失敗しました。")
        except Exception as e:
            print(f"Connection Error: {e}")
            await interaction.followup.send(content="画像生成サーバーに接続できませんでした。")

    async def levels_command(self, interaction: discord.Interaction, **kwargs):
        await interaction.response.defer()

        if not self.bot.api:
            return

        levels = await self.bot.api.get_level_leaderboard(interaction.guild.id)

        levels.sort(key=lambda x: (x['level'], x['xp']), reverse=True)

        description = ""

        for i, user_data in enumerate(levels, 1):
            user_id = user_data['user_id']
            level = user_data['level']
            xp = user_data['xp']
            
            member = interaction.guild.get_member(int(user_id))
            name = member.mention if member else f"Unknown({user_id})"
            
            medal = "🥇" if i == 1 else "🥈" if i == 2 else "🥉" if i == 3 else f"#{i}"
            description += f"{medal} | {name} - **Lv.{level}** (XP: {xp})\n"
            
        embed = discord.Embed(color=discord.Color.blue(), title=f"{interaction.guild.name}のレベルランキング", description=description)
        await interaction.followup.send(embed=embed)

    async def sync_member_rewards(self, guild: discord.Guild, user_id: int, current_lv: int):
        member = guild.get_member(int(user_id))
        if not member: return

        rewards = await self.bot.api.get_level_rewards(guild.id)
        if not rewards: return

        roles_to_add = []
        roles_to_remove = []

        for lv_threshold, role_id in rewards.items():
            role = guild.get_role(int(role_id))
            if not role: continue

            if current_lv >= lv_threshold:
                if role not in member.roles:
                    roles_to_add.append(role)
            else:
                if role in member.roles:
                    roles_to_remove.append(role)

        if roles_to_add:
            await member.add_roles(*roles_to_add, reason="Level rewards sync")
        if roles_to_remove:
            await member.remove_roles(*roles_to_remove, reason="Level rewards sync")

    async def give_xp_command(self, interaction: discord.Interaction, **kwargs):
        if not self.bot.api: return
        await interaction.response.defer(ephemeral=True)

        user_id = str(kwargs.get("user"))
        amount = int(kwargs.get("amount"))
        guild_id = str(interaction.guild.id)

        data = await self.bot.api.get_user_level(guild_id, user_id)
        old_xp = data['xp'] if data else 0
        old_lv = data['level'] if data else 1
        
        new_xp = max(0, old_xp + amount)
        new_lv = LevelUtils.get_level_from_total_xp(new_xp)
        
        await self.bot.api.save_user_level(guild_id, user_id, new_lv, new_xp)
        
        if new_lv != old_lv:
            await self.sync_member_rewards(interaction.guild, user_id, new_lv)

        await interaction.followup.send(
            f"<@{user_id}> に {amount} XPを追加しました。",
            allowed_mentions=discord.AllowedMentions.none()
        )

    async def remove_xp_command(self, interaction: discord.Interaction, **kwargs):
        if not self.bot.api: return
        await interaction.response.defer(ephemeral=True)

        user_id = kwargs.get("user")
        amount = kwargs.get("amount")
        guild_id = str(interaction.guild.id)

        data = await self.bot.api.get_user_level(guild_id, str(user_id))
        current_lv = data['level'] if data else 1
        current_xp = data['xp'] if data else 0
        
        new_xp = max(0, current_xp - int(amount))
        
        await self.bot.api.save_user_level(guild_id, str(user_id), current_lv, new_xp)
        await interaction.followup.send(f"<@{user_id}> から {amount} XPを削除しました。", allowed_mentions=discord.AllowedMentions.none())

    def level_parse(self, template: str, member: discord.Member, nowlevel: int, oldlevel: int) -> str:
        return template.replace("{ユーザー名}", member.display_name).replace("{ユーザーID}", str(member.id)).replace("{メンション}", member.mention).replace("{サーバー名}", member.guild.name).replace("{現在レベル}", str(nowlevel)).replace("{前のレベル}", str(oldlevel))

    @commands.Cog.listener()
    async def on_message(self, message: discord.Message):
        if message.author.bot or not message.guild:
            return

        guild_id = str(message.guild.id)

        if not self.bot.api:
            return
        
        is_enabled = await self.bot.api.is_module_enabled(guild_id, "levels")
        if not is_enabled:
            return
        
        if not is_enabled.get('enabled'):
            return

        user_id = str(message.author.id)
        current_time = time.time()
        cooldown_key = (guild_id, user_id)

        if self.cooldowns.get(cooldown_key, 0) > current_time - 60:
             return
        self.cooldowns[cooldown_key] = current_time

        data = await self.bot.api.get_user_level(guild_id, user_id)
        current_lv = data['level'] if data else 1
        current_xp = data['xp'] if data else 0
        
        xp_to_add = random.randint(15, 25)
        new_xp = current_xp + xp_to_add

        next_lv_xp = 5 * (current_lv ** 2) + 50 * current_lv + 100

        leveled_up = False
        if new_xp >= next_lv_xp:
            current_lv += 1
            new_xp -= next_lv_xp
            leveled_up = True

        await self.bot.api.save_user_level(guild_id, user_id, current_lv, new_xp)

        if leveled_up:
            await self._handle_level_up(message, guild_id, current_lv)

    async def _handle_level_up(self, message: discord.Message, guild_id, new_level):
        settings = await self.bot.api.get_level_setting(guild_id)
        rewards = await self.bot.api.get_level_rewards(guild_id)

        for reward in rewards:
            if reward['level'] == new_level:
                role = message.guild.get_role(int(reward['role_id']))
                if role:
                    try:
                        await message.author.add_roles(role)
                        await asyncio.sleep(0.5)
                    except discord.Forbidden:
                        pass

        channel = None
        if settings.get("channel_id"):
            channel = message.guild.get_channel(int(settings["channel_id"]))
        
        if not channel:
            return

        content = settings.get("content")
        if content:
            content = self.level_parse(content, message.author, new_level, new_level - 1)
        else:
            content = None

        embed = None
        embed_setting = settings.get("embed")
        if embed_setting:
            embed_data = copy.deepcopy(embed_setting.get("data", {}))
            
            if "description" in embed_data:
                embed_data["description"] = self.level_parse(embed_data["description"], message.author, new_level, new_level - 1)
            if "title" in embed_data:
                embed_data["title"] = self.level_parse(embed_data["title"], message.author, new_level, new_level - 1)
            
            embed = discord.Embed.from_dict(embed_data)

        if content or embed:
            await channel.send(content=content, embed=embed)

async def setup(bot):
    await bot.add_cog(LevelsCog(bot))
