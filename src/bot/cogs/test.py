from discord.ext import commands
import discord

from main import NewSharkBot

from lib.command import Command


class TestCog(commands.Cog):
    def __init__(self, bot: NewSharkBot):
        self.bot = bot

        # コマンドをここに
        test = Command(name="test", description="テストコマンドです。")
        test.execute = self.test_command
        self.bot.add_slashcommand(test)

        print("init -> TestCog")

    async def test_command(self, interaction: discord.Interaction):
        await interaction.response.send_message(content="テストです。", ephemeral=True)


async def setup(bot):
    await bot.add_cog(TestCog(bot))
