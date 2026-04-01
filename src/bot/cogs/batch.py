import discord
from discord.ext import commands, tasks
from lib import command
from main import NewSharkBot
from lib.command import Command

class BatchCog(commands.Cog):
    def __init__(self, bot: NewSharkBot):
        self.bot = bot

        cmd = command.Command(name="slash", description="スラッシュコマンドの設定方法を知ります。", module_name="システム")
        cmd.execute = self.why_command
        self.bot.add_slashcommand(cmd)

        print("init -> BatchCog")

    @commands.Cog.listener()
    async def on_ready(self):
        if not self.batch_change_activity.is_running():
            self.batch_change_activity.start()

    @tasks.loop(seconds=30)
    async def batch_change_activity(self):
        activity = discord.CustomActivity(name="ダッシュボードに移行しました。")
        await self.bot.change_presence(activity=activity)

    async def why_command(self, interaction: discord.Interaction):
        await interaction.response.send_message(ephemeral=True, content="スラッシュコマンドはダッシュボードで各自ONにしていただくようになりました。\nモジュールを有効にし、必要なコマンドを設定する必要があります。\nダッシュボードには、以下からアクセスできます。\nhttps://www.sharkbot.xyz/")

async def setup(bot):
    await bot.add_cog(BatchCog(bot))