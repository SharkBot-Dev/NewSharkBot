import logging
import os

import aiohttp
from discord.ext import commands, tasks

from main import NewSharkBot


class KumaPostCog(commands.Cog):
    def __init__(self, bot: NewSharkBot):
        self.bot = bot
        self.session = aiohttp.ClientSession()
        self.kuma_post_loop.start()

    def cog_unload(self):
        self.kuma_post_loop.cancel()
        self.bot.loop.create_task(self.session.close())

    async def send_heartbeat(self):
        try:
            url = os.environ.get("PUSH_URL")
            latency = round(self.bot.latency * 1000)

            await self.session.get(
                f"{url}?status=up&msg=OK&ping={latency}"
            )
        except Exception as e:
            logging.error(f"UpTimeKumaにPostできませんでした: {e}")

    @tasks.loop(seconds=60)
    async def kuma_post_loop(self):
        if not self.bot.debug:
            await self.send_heartbeat()

    @kuma_post_loop.before_loop
    async def before_kuma_loop(self):
        await self.bot.wait_until_ready()


async def setup(bot):
    await bot.add_cog(KumaPostCog(bot))