import discord
from discord.ext import commands, tasks
from main import NewSharkBot
from lib.command import Command

class BatchCog(commands.Cog):
    def __init__(self, bot: NewSharkBot):
        self.bot = bot
        print("init -> BatchCog")

    async def cog_load(self):
        if not self.batch_change_activity.is_running():
            self.batch_change_activity.start()

    async def cog_unload(self):
        self.batch_change_activity.cancel()

    @tasks.loop(minutes=1)
    async def batch_change_activity(self):
        activity = discord.CustomActivity(name="ダッシュボードから設定できます。")
        await self.bot.change_presence(activity=activity)

async def setup(bot):
    await bot.add_cog(BatchCog(bot))