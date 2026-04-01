import logging
import os

import aiohttp
import discord
from discord.ext import commands
from main import NewSharkBot

COMMANDS = [
    {
        "name": "help",
        "description": "Botのコマンド一覧や詳細を表示します。",
        "options": [
            {
                "name": "command",
                "description": "詳細を表示したいコマンド名を入力してください。",
                "type": 3,
                "required": False,
            },
        ],
    },
    {
        "name": "dashboard",
        "description": "ダッシュボードの案内を表示します。",
    },
]

class BotJoinCog(commands.Cog):
    def __init__(self, bot: NewSharkBot):
        self.bot = bot
        self.DISCORD_API_BASE_URL = "https://discord.com/api/v10"
        print("init -> BotJoinCog")

    async def sync_slash_commands(self, guild_id: str):
        token = os.environ.get("DISCORD_TOKEN")

        url = f"{self.DISCORD_API_BASE_URL}/applications/{self.bot.user.id}/guilds/{guild_id}/commands"
        
        headers = {
            "Authorization": f"Bot {token}",
            "Content-Type": "application/json"
        }

        async with aiohttp.ClientSession() as session:
            async with session.put(
                url, 
                headers=headers,
                json=COMMANDS
            ) as response:
                
                if not response.ok:
                    try:
                        error_data = await response.json()
                    except Exception:
                        error_data = {}
                    raise Exception(f"Failed to sync commands: {COMMANDS}")

                return await response.json()

    @commands.Cog.listener("on_guild_join")
    async def on_guild_join(self, guild: discord.Guild):
        try:
            await self.sync_slash_commands(str(guild.id))
        except Exception as e:
            logging.warning(f"Failed to sync commands for guild {guild.id}: {e}")

        if guild.system_channel:
            try:
                view = discord.ui.View()
                view.add_item(discord.ui.Button(label="ダッシュボード", url="https://www.sharkbot.xyz/"))

                embed_1 = discord.Embed(title="Botが正常に導入されました！", description="よろしくね！\nセットアップはダッシュボードから行うことができるよ！", color=discord.Color.blue())
                embed_2 = discord.Embed(title="標準コマンドの使い方", color=discord.Color.blue())
                embed_2.add_field(name="/help", value="ヘルプを表示できます。\nこのヘルプにはダッシュボードで有効化したモジュールのコマンドのみ表示されます。", inline=False)
                embed_2.add_field(name="/dashboard", value="ダッシュボードのURLを取得できます。", inline=False)

                await guild.system_channel.send(embeds=[embed_1, embed_2], view=view)
            except discord.HTTPException as e:
                logging.warning(f"Failed to send welcome message to guild {guild.id}: {e}")

async def setup(bot):
    await bot.add_cog(BotJoinCog(bot))