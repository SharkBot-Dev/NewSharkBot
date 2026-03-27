import asyncio
import copy
import time

from discord.ext import commands
import random
import discord

from main import NewSharkBot


class LevelsCog(commands.Cog):
    def __init__(self, bot: NewSharkBot):
        self.bot = bot
        self.cooldowns = {}
        self.api_client = bot.api
        print("init -> LevelsCog")

    def level_parse(self, template: str, member: discord.Member, nowlevel: int, oldlevel: int) -> str:
        return template.replace("{ユーザー名}", member.display_name).replace("{ユーザーID}", str(member.id)).replace("{メンション}", member.mention).replace("{サーバー名}", member.guild.name).replace("{現在レベル}", str(nowlevel)).replace("{前のレベル}", str(oldlevel))

    @commands.Cog.listener()
    async def on_message(self, message: discord.Message):
        if message.author.bot or not message.guild:
            return

        guild_id = str(message.guild.id)
        user_id = str(message.author.id)
        current_time = time.time()

        if self.cooldowns.get(user_id, 0) > current_time - 60:
            return

        data = await self.api_client.get_user_level(guild_id, user_id)
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

        await self.api_client.save_user_level(guild_id, user_id, current_lv, new_xp)
        self.cooldowns[user_id] = current_time

        if leveled_up:
            await self._handle_level_up(message, guild_id, current_lv)

    async def _handle_level_up(self, message: discord.Message, guild_id, new_level):
        settings = await self.api_client.get_level_setting(guild_id)
        rewards = await self.api_client.get_level_rewards(guild_id)

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
            target_channel = self.bot.get_channel(int(settings["channel_id"]))
            if target_channel:
                channel = target_channel

        if not channel:
            return

        content = settings.get("content")
        if not content:
            return
        else:
            content = self.level_parse(content, message.author, new_level, new_level - 1)

        embed = None
        embed_setting = settings.get("Embed")
            
        if embed_setting:
            embed_data = copy.deepcopy(embed_setting.get("data", {}))
                
            if "description" in embed_data:
                embed_data["description"] = self.level_parse(embed_data["description"], message.author, new_level, new_level - 1)
            if "title" in embed_data:
                embed_data["title"] = self.level_parse(embed_data["title"], message.author, new_level, new_level - 1)
            
            embed = discord.Embed.from_dict(embed_data)
        
        await channel.send(content)

async def setup(bot):
    await bot.add_cog(LevelsCog(bot))
