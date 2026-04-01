import logging
import os
from typing import Dict
import aiohttp
import dotenv
from discord.ext import commands
import discord
from redis.asyncio import Redis, ConnectionPool

from lib import tree
from lib.command import Command
from lib.embed import Embed as customEmbed
from lib.api import ResourceAPIClient

dotenv.load_dotenv()

COMMANDS = [
    {
        "name": "why",
        "description": "スラッシュコマンドの設定方法を知ります。",
    },
]

class NewSharkBot(commands.AutoShardedBot):
    def __init__(self):
        super().__init__(
            command_prefix="!",
            help_command=None,
            intents=discord.Intents.all(),
            tree_cls=tree.CustomTree,
        )
        print("InitDone")

        self.redis: Redis = None

        self.session = None
        self.api = None

        self.slashcommands: Dict[str, Command] = {}
        self.embed = customEmbed(self)

        self.DISCORD_API_BASE_URL = "https://discord.com/api/v10"

    def add_slashcommand(self, command: Command):
        self.slashcommands[command.name] = command

    async def close(self):
        if self.redis is not None:
            await self.redis.aclose()
            print("Redis connection closed")

        if self.session is not None:
            await self.session.close()

        await super().close()

    async def sync_slash_commands(self):
        url = f"{self.DISCORD_API_BASE_URL}/applications/{bot.user.id}/commands"
        
        headers = {
            "Authorization": f"Bot {self.http.token}",
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

bot = NewSharkBot()


async def load_cogs(bot: commands.Bot, base_folder="cogs"):
    for root, dirs, files in os.walk(base_folder):
        for file in files:
            if file.endswith(".py") and not file.startswith("_"):
                relative_path = os.path.relpath(os.path.join(root, file), base_folder)
                module = relative_path.replace(os.sep, ".")[:-3]
                module = f"{base_folder}.{module}"
                try:
                    await bot.load_extension(module)
                except Exception as e:
                    logging.error(f"Failed to load {module}: {e}")

@bot.event
async def setup_hook() -> None:
    await load_cogs(bot)

    await bot.sync_slash_commands()

    bot.session = aiohttp.ClientSession()

    base_url = os.environ.get("RESOURCE_API_BASE_URL", "http://localhost:8080")
    bot.api = ResourceAPIClient(bot.session, base_url)    

@bot.event
async def on_message(message: discord.Message):
    return

@bot.event
async def on_ready():
    print(f"Logged in as {bot.user} (ID: {bot.user.id})")
    print("------")

    if not bot.redis:
        pool = ConnectionPool.from_url("redis://redis:6379/0", decode_responses=True)
        bot.redis = Redis(connection_pool=pool)

    if bot.redis:
        await bot.redis.set("bot_status", "online")
        print("Redis status updated.")

if __name__ == "__main__":
    bot.run(os.environ.get("DISCORD_TOKEN"))
