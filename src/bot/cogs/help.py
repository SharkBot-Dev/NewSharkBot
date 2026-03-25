from discord.ext import commands
import discord
import asyncio

from main import NewSharkBot
from lib.command import Command

class HelpCog(commands.Cog):
    def __init__(self, bot: NewSharkBot):
        self.bot = bot
        
        help_cmd = Command(name="help", description="Botのコマンド一覧や詳細を表示します。")
        help_cmd.execute = self.help_command
        self.bot.add_slashcommand(help_cmd)

        dashboard_cmd = Command(name="dashboard", description="ダッシュボードの案内を表示します。")
        dashboard_cmd.execute = self.dashboard_command
        self.bot.add_slashcommand(dashboard_cmd)
        print("init -> HelpCog")

    async def help_command(self, interaction: discord.Interaction, **kwargs):
        await interaction.response.defer()

        command_name = kwargs.get("command")
        embed = discord.Embed(color=discord.Color.blue())
        embed.set_author(name=f"{interaction.guild.me.display_name}のヘルプ", icon_url=interaction.guild.me.display_avatar.url)

        if command_name:
            command = self.bot.slashcommands.get(command_name)
            if command:
                embed.title = f"コマンド: /{command.name}"
                embed.description = f"説明: {command.description}"
            else:
                embed.title = "エラー"
                embed.description = f"コマンド `{command_name}` は見つかりませんでした。"
                embed.color = discord.Color.red()

        else:
            embed.title = "コマンド一覧"
            cmd_list = []
            for cmd in self.bot.slashcommands.values():
                cmd_list.append(f"`/{cmd.name}` - {cmd.description}")
            
            embed.description = "\n".join(cmd_list) if cmd_list else "利用可能なコマンドはありません。"
            embed.set_footer(text="/help [コマンド名] で詳細を表示できます")

        await interaction.followup.send(embed=embed)

    async def dashboard_command(self, interaction: discord.Interaction, **kwargs):
        await interaction.response.send_message(ephemeral=True, content="ここにダッシュボードURLを入れる")

async def setup(bot):
    await bot.add_cog(HelpCog(bot))