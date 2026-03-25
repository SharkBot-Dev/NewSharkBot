from discord.ext import commands
import discord
import asyncio

from main import NewSharkBot


class CommandsCog(commands.Cog):
    def __init__(self, bot: NewSharkBot):
        self.bot = bot
        print("init -> CommandsCog")

    @commands.Cog.listener("on_interaction")
    async def on_interaction_commands(self, interaction: discord.Interaction):
        if interaction.type != discord.InteractionType.application_command:
            return

        commands_list = self.bot.slashcommands
        command = commands_list.get(interaction.data.get("name", "none"), None)
        if not command:
            await interaction.response.send_message(
                ephemeral=True,
                content="そのコマンドは見つかりません。\n削除された可能性があります。",
            )
            return

        asyncio.create_task(command.execute(interaction))


async def setup(bot):
    await bot.add_cog(CommandsCog(bot))
