from discord.ext import commands

class Embed:
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    async def getEmbed(self, guild_id: str, title: str):
        fetch = await self.bot.async_db["SharkBot"]["embed_setting"].find_one({"guildId": guild_id})
        if not fetch:
            return None

        return fetch.get("embeds", {}).get(title, None)