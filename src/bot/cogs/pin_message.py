import asyncio
import logging
import discord
from discord.ext import commands
from typing import Set

class PinMessageCog(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        self.working_channels: Set[int] = set()
        print("PinMessageCog has been initialized.")

    @commands.Cog.listener()
    async def on_message(self, message: discord.Message):
        if message.author.id == self.bot.user.id or not message.guild:
            return

        is_enabled = await self.bot.api.is_module_enabled(str(message.guild.id), "embed")
        if not is_enabled or not is_enabled.get('enabled'):
            return

        pin_data = await self.bot.api.get_pin_setting(str(message.guild.id), str(message.channel.id))
        if not pin_data:
            return

        if message.channel.id in self.working_channels:
            return

        self.working_channels.add(message.channel.id)

        try:
            last_message_id = pin_data.get("last_message_id")
            content = pin_data.get("content", "")
            embed_id = pin_data.get("embed_id")

            embeds = await self.bot.api.fetch_embed_settings(str(message.guild.id))
            target_embed = next((e for e in embeds if str(e.get('ID')) == str(embed_id)), None)
            
            if not target_embed:
                return

            await asyncio.sleep(5)

            embed = discord.Embed.from_dict(target_embed.get("data", {}))

            if last_message_id:
                try:
                    old_msg = discord.PartialMessage(channel=message.channel, id=int(last_message_id))
                    await old_msg.delete()
                except (discord.NotFound, discord.Forbidden, ValueError):
                    pass

            await asyncio.sleep(1)

            new_msg = await message.channel.send(content=content, embed=embed)

            await self.bot.api.create_pin(str(message.guild.id), {
                "channel_id": str(message.channel.id),
                "last_message_id": str(new_msg.id),
                "content": content,
                "embed_id": str(embed_id)
            })

        except Exception as e:
            logging.error(f"Error in PinMessageCog: {e}")
        finally:
            await asyncio.sleep(1)
            self.working_channels.discard(message.channel.id)

async def setup(bot):
    await bot.add_cog(PinMessageCog(bot))