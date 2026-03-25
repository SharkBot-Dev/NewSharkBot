import discord


class CustomTree(discord.app_commands.CommandTree):
    def _from_interaction(self, interaction: discord.Interaction) -> None:
        return