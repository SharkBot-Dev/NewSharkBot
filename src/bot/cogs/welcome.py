import logging

from discord.ext import commands
import discord

from main import NewSharkBot
from lib.command import Command

import copy


class WelcomeCog(commands.Cog):
    def __init__(self, bot: NewSharkBot):
        self.bot = bot
        print("init -> WelcomeCog")

    def welcome_parse(self, template: str, member: discord.Member) -> str:
        return template.replace("{ユーザー名}", member.display_name).replace("{ユーザーID}", str(member.id)).replace("{メンション}", member.mention).replace("{サーバー名}", member.guild.name)

    async def _handle_member_event(self, member: discord.Member, event_type: str):
        if not self.bot.api:
            return

        guild_id = str(member.guild.id)

        try:
            setting = await self.bot.api.fetch_message_setting(guild_id, event_type)
            if not setting:
                return

            content = self.welcome_parse(setting.get("content", ""), member)
            channel_id = setting.get("channel_id")
            
            if not channel_id:
                return
            
            channel = member.guild.get_channel(int(channel_id))
            if not channel:
                return

            embed = None
            
            embed_id = setting.get('embed_id')
            if embed_id:
                embed_setting = await self.bot.embed.getEmbed(guild_id, embed_id)
                if embed_setting:
                    embed_data = copy.deepcopy(embed_setting) or {}
                        
                    if isinstance(embed_data, dict):
                        embed = discord.Embed.from_dict(embed_data)
                        embed = self.bot.embed._apply_placeholders_to_embed(embed, {
                            "ユーザー名": member.display_name,
                            "ユーザーID": str(member.id),
                            "メンション": member.mention,
                            "サーバー名": member.guild.name
                        })

            if not content and not embed:
                return

            await channel.send(content=content or None, embed=embed)

        except Exception as e:
            logging.error(f"Error in {event_type} event: {e}")

    @commands.Cog.listener()
    async def on_member_join(self, member: discord.Member):
        await self._handle_member_event(member, "welcome")

    @commands.Cog.listener()
    async def on_member_remove(self, member: discord.Member):
        await self._handle_member_event(member, "goodbye")

async def setup(bot):
    await bot.add_cog(WelcomeCog(bot))
