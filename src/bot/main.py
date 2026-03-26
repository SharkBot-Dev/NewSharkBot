import os
from typing import Dict
import dotenv
from discord.ext import commands
import discord

from lib import tree
from lib.command import Command

dotenv.load_dotenv()


class NewSharkBot(commands.AutoShardedBot):
    def __init__(self):
        super().__init__(
            command_prefix="!",
            help_command=None,
            intents=discord.Intents.all(),
            tree_cls=tree.CustomTree,
        )
        print("InitDone")

        self.slashcommands: Dict[str, Command] = {}
        self.embed = customEmbed(self)

    def add_slashcommand(self, command: Command):
        self.slashcommands[command.name] = command


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
                    print(f"Failed to load {module}: {e}")


@bot.event
async def setup_hook() -> None:
    await load_cogs(bot)


if __name__ == "__main__":
    bot.run(os.environ.get("DISCORD_TOKEN"))
