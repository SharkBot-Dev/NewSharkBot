import collections
import string

import discord
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
                
        return None
    
    def _apply_placeholders_to_embed(self, embed: discord.Embed, placeholders: dict) -> discord.Embed:
        if embed.title:
            embed.title = self.safe_format(embed.title, placeholders)
            embed.title = embed.title.format(**placeholders)
        
        if embed.description:
            embed.description = self.safe_format(embed.description, placeholders)
            embed.description = embed.description.format(**placeholders)
        
        for field in embed.fields:
            field.name = self.safe_format(field.name, placeholders)
            field.name = field.name.format(**placeholders)
            field.value = self.safe_format(field.value, placeholders)
            field.value = field.value.format(**placeholders)
            
        if embed.footer and embed.footer.text:
            embed.footer.text = self.safe_format(field.name, placeholders)
            embed.set_footer(text=embed.footer.text.format(**placeholders))
            
        return embed
    
    def safe_format(self, template: str, placeholders: dict) -> str:
        if not template:
            return ""
        
        return string.Formatter().vformat(
            template, 
            (), 
            collections.defaultdict(str, placeholders)
        )