from discord.ext import commands
import discord

from main import NewSharkBot
from lib.command import Command


class WelcomeCog(commands.Cog):
    def __init__(self, bot: NewSharkBot):
        self.bot = bot
        print("init -> WelcomeCog")

    def welcome_parse(self, template: str, member: discord.Member) -> str:
        return template.replace("{ユーザー名}", member.display_name).replace("{ユーザーID}", str(member.id)).replace("{メンション}", member.mention).replace("{サーバー名}", member.guild.name)

    @commands.Cog.listener()
    async def on_member_join(self, member: discord.Member):
        guild_id = str(member.guild.id)

        data = await self.bot.async_db["SharkBot"]["welcome_setting"].find_one({"guildId": guild_id})
        if not data or "welcome" not in data:
            return
        
        if data["welcome"].get("enabled", False) == False:
            return

        message = self.welcome_parse(data["welcome"].get("message", "ようこそ、{ユーザー名}！"), member)

        channel = member.guild.get_channel(int(data["welcome"]["channelId"]))
        if not channel:
            return

        embed_name = data["welcome"].get('embed', None)
        if not embed_name:
            if message == "":
                return
            await channel.send(content=message)
            return

        embed_data = await self.bot.embed.getEmbed(guild_id, embed_name)
        if not embed_data:
            if message == "":
                return
            await channel.send(content=message)
            return
        
        embed_data["description"] = self.welcome_parse(embed_data.get("description", ""), member)
        embed_data["title"] = self.welcome_parse(embed_data.get("title", ""), member)

        embed = discord.Embed.from_dict(embed_data)
        if message == "":
            await channel.send(embed=embed)
            return
        await channel.send(content=message, embed=embed)

    @commands.Cog.listener()
    async def on_member_remove(self, member: discord.Member):
        guild_id = str(member.guild.id)

        data = await self.bot.async_db["SharkBot"]["welcome_setting"].find_one({"guildId": guild_id})
        if not data or "goodbye" not in data:
            return

        if data["goodbye"].get("enabled", False) == False:
            return
        
        message = self.welcome_parse(data["goodbye"].get("message", "{ユーザー名}が退出しました。"), member)

        channel = member.guild.get_channel(int(data["goodbye"]["channelId"]))
        if not channel:
            return

        embed_name = data["goodbye"].get('embed', None)

        if not embed_name:
            if message == "":
                return

            await channel.send(content=message)
            return

        embed_data = await self.bot.embed.getEmbed(guild_id, embed_name)
        if not embed_data:
            if message == "":
                return
            await channel.send(content=message)
            return

        embed_data["description"] = self.welcome_parse(embed_data.get("description", ""), member)
        embed_data["title"] = self.welcome_parse(embed_data.get("title", ""), member)

        embed = discord.Embed.from_dict(embed_data)
        await channel.send(content=self.welcome_parse(data["goodbye"].get("message", "{ユーザー名}が退出しました。"), member), embed=embed)

async def setup(bot):
    await bot.add_cog(WelcomeCog(bot))
