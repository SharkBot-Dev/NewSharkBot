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
        self._register_commands()

    def _register_commands(self):
        commands_to_add = [
            ("imgur", "Imgurで画像を検索します。", self.imgur_command),
            ("youtube", "Youtubeで動画を検索します。", self.youtube_command),
        ]

        for name, desc, func in commands_to_add:
            cmd = Command(name=name, description=desc, module_name="検索")
            cmd.execute = func
            self.bot.add_slashcommand(cmd)

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
                        "結果が見つかりませんでした。"
                    )
        except:
            return await interaction.followup.send(f"検索に失敗しました。")

    async def youtube_command(self, interaction: discord.Interaction, **kwargs):
        await interaction.response.defer()

        search = kwargs.get('search')
        if not search:
            return await interaction.followup.send("検索ワードを入力してください。")

        token = os.environ.get('YOUTUBE_APIKEY')
        if not token:
            return await interaction.followup.send("内部エラーが発生しました。")

        url = "https://www.googleapis.com/youtube/v3/search"
        params = {
            'part': 'snippet',
            'q': search,
            'maxResults': 1,
            'type': 'video',
            'key': token
        }

        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        
                        if data.get('items'):
                            video_id = data['items'][0]['id']['videoId']
                            video_url = f"https://www.youtube.com/watch?v={video_id}"
                            await interaction.followup.send(video_url)
                        else:
                            await interaction.followup.send("動画が見つかりませんでした。")
                    else:
                        await interaction.followup.send("エラーが発生しました")
        except:
            return await interaction.followup.send("エラーが発生しました")

async def setup(bot):
    await bot.add_cog(SearchCog(bot))
