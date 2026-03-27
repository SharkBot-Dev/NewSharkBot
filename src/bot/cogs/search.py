import os

import aiohttp
from discord.ext import commands
import discord

from main import NewSharkBot
from lib.command import Command

from typing import Dict


class SearchCog(commands.Cog):
    def __init__(self, bot: NewSharkBot):
        self.bot = bot

        help_cmd = Command(
            name="imgur", description="Imgurで画像を検索します。", module_name="検索"
        )
        help_cmd.execute = self.imgur_command
        self.bot.add_slashcommand(help_cmd)

    async def imgur_command(self, interaction: discord.Interaction, **kwargs):
        search = kwargs.get('search')

        token = os.environ.get('IMGUR_CLIENTID')

        await interaction.response.defer()
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"https://api.imgur.com/3/gallery/search",
                    params={"q": search},
                    headers={"Authorization": f"Client-ID {token}"},
                ) as resp:
                    data = await resp.json()

                    if data and "data" in data:
                        for item in data["data"]:
                            return await interaction.followup.send(f"{item['link']}")

                    return await interaction.followup.send(
                        f"結果が見つかりませんでした。"
                    )
        except:
            return await interaction.followup.send(f"検索に失敗しました。")

async def setup(bot):
    await bot.add_cog(SearchCog(bot))
