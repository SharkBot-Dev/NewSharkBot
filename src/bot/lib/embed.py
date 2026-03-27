from discord.ext import commands

class Embed:
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    async def getEmbed(self, guild_id: str, embed_id: str):
        embed = await self.bot.api.fetch_embed_settings(guild_id)
        if embed:
            for e in embed:
                if e['ID'] == embed_id:
                    return e['data']