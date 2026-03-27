import discord
from discord.ext import commands, tasks
from main import NewSharkBot
from lib.command import Command

class BatchCog(commands.Cog):
    def __init__(self, bot: NewSharkBot):
        self.bot = bot
        print("init -> BatchCog")

    @commands.Cog.listener()
    async def on_ready(self):
        if not self.batch_change_activity.is_running():
            self.batch_change_activity.start()

    @tasks.loop(seconds=30)
    async def batch_change_activity(self):
        activity = discord.CustomActivity(name="ダッシュボードから設定できます。")
        await self.bot.change_presence(activity=activity)

async def setup(bot):
    await bot.add_cog(BatchCog(bot))