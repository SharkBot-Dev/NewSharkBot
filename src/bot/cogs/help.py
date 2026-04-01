from discord.ext import commands
import discord

from main import NewSharkBot
from lib.command import Command


class HelpCog(commands.Cog):
    def __init__(self, bot: NewSharkBot):
        self.bot = bot

        help_cmd = Command(
            name="help", description="Botのコマンド一覧や詳細を表示します。", module_name="ヘルプ"
        )
        help_cmd.execute = self.help_command
        self.bot.add_slashcommand(help_cmd)

        dashboard_cmd = Command(
            name="dashboard", description="ダッシュボードの案内を表示します。", module_name="ヘルプ"
        )
        dashboard_cmd.execute = self.dashboard_command
        self.bot.add_slashcommand(dashboard_cmd)
        print("init -> HelpCog")

    async def help_command(self, interaction: discord.Interaction, **kwargs):
        await interaction.response.defer()

        command_name = kwargs.get("command")
        embed = discord.Embed(color=discord.Color.blue())
        embed.set_author(
            name=f"{interaction.guild.me.display_name}のヘルプ",
            icon_url=interaction.guild.me.display_avatar.url,
        )

        server_commands = await self.bot.tree.fetch_commands(guild=interaction.guild)
        server_cmd_dict = {cmd.name: cmd for cmd in server_commands}

        if command_name:
            target_name = command_name.lstrip("/")
            
            api_cmd = server_cmd_dict.get(target_name)
            internal_cmd = self.bot.slashcommands.get(target_name)

            if api_cmd:
                embed.title = f"コマンド: /{api_cmd.name}"
                category = getattr(internal_cmd, "module_name", "一般") if internal_cmd else "一般"
                description = internal_cmd.description if internal_cmd else api_cmd.description
                
                embed.description = f"**カテゴリー:** {category}\n**説明:** {description or '説明なし'}"
            else:
                embed.title = "エラー"
                embed.description = f"コマンド `{command_name}` は見つかりませんでした。"
                embed.color = discord.Color.red()

        else:
            embed.title = "コマンド一覧（カテゴリー別）"
            modules = {}

            for name, api_cmd in server_cmd_dict.items():
                internal_cmd = self.bot.slashcommands.get(name)
                
                mod_name = getattr(internal_cmd, "module_name", "その他") if internal_cmd else "その他"
                
                if mod_name not in modules:
                    modules[mod_name] = []
                modules[mod_name].append(f"`/{name}`")

            if modules:
                for mod_name in sorted(modules.keys()):
                    embed.add_field(
                        name=f"📦 {mod_name}", 
                        value=", ".join(modules[mod_name]), 
                        inline=False
                    )
            else:
                embed.description = "利用可能なコマンドはありません。"
                
            embed.set_footer(text="/help [コマンド名] で詳細を表示できます")

        await interaction.followup.send(embed=embed)

    async def dashboard_command(self, interaction: discord.Interaction, **kwargs):
        await interaction.response.send_message(
            ephemeral=True, content="https://www.sharkbot.xyz/"
        )


async def setup(bot):
    await bot.add_cog(HelpCog(bot))
