import logging
from datetime import datetime, timezone, timedelta
import discord
from discord.ext import commands, tasks

class BumpsCog(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        print("init -> BumpsCog")
        self.bump_check_loop.start()

        self.ON_MESSAGE_BOTS = ["302050872383242240"]
        self.ON_EDIT_BOTS = ["761562078095867916"]

    def cog_unload(self):
        self.bump_check_loop.cancel()

    async def update_single_bot_setting(self, guild_id: int, bot_id: str, updates: dict):
        current_settings = await self.bot.api.get_bump_settings(guild_id)
        if not current_settings or "bots" not in current_settings:
            return False

        updated_bots = []
        found = False
        for bot in current_settings["bots"]:
            if bot["bot_id"] == bot_id:
                bot.update(updates)
                found = True
            updated_bots.append(bot)

        if not found:
            return False
        
        payload = {"bots": updated_bots}
        return await self.bot.api.save_bump_settings(guild_id, payload)

    @tasks.loop(seconds=30)
    async def bump_check_loop(self):
        pending_list = await self.bot.api.get_pending_bumps()
        if not pending_list:
            return

        for item in pending_list:
            try:
                guild_id = int(item.get('guild_id'))
                bot_id = item.get('bot_id')

                await self.update_single_bot_setting(guild_id, bot_id, {"next_notify_at": None})

                guild = self.bot.get_guild(guild_id)
                if not guild:
                    continue

                channel_id = int(item.get('channel_id'))
                channel = guild.get_channel(channel_id)

                if channel:
                    role_ids = item.get('role_ids', [])
                    mentions = " ".join([f"<@&{rid}>" for rid in role_ids])
                    content = f"{mentions}\n{item.get('content', '')}"
                    await channel.send(content)

                    await self.update_single_bot_setting(
                        guild_id, 
                        item.get('bot_id'), 
                        {"next_notify_at": None}
                    )
            except Exception as e:
                logging.error(f"Error in bump loop: {e}")

    @commands.Cog.listener()
    async def on_message(self, message: discord.Message):
        if not message.guild or not message.author.bot:
            return

        status = await self.bot.api.is_module_enabled(str(message.guild.id), "bump")
        if not status or not status.get('enabled'):
            return

        is_success = False
        if message.embeds:
            desc = message.embeds[0].description or ""
            if "表示順をアップ" in desc or "Bump done" in desc:
                is_success = True

        if is_success:
            bot_id_str = str(message.author.id)
            if not bot_id_str in self.ON_MESSAGE_BOTS:
                return

            next_time = (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat()
            updates = {
                "next_notify_at": next_time,
                "last_bumped_at": datetime.now(timezone.utc).isoformat()
            }
            
            if await self.update_single_bot_setting(message.guild.id, bot_id_str, updates):
                await message.add_reaction("✅")

    @commands.Cog.listener("on_message_edit")
    async def on_message_edit(self, before: discord.Message, after: discord.Message):
        if not after.guild or not after.author.bot:
            return

        status = await self.bot.api.is_module_enabled(str(after.guild.id), "bump")
        if not status or not status.get('enabled'):
            return

        is_success = False
        if after.embeds and after.embeds[0].fields:
            if "をアップしたよ!" in after.embeds[0].fields[0].name:
                is_success = True

        if is_success:
            bot_id_str = str(after.author.id)
            if not bot_id_str in self.ON_EDIT_BOTS:
                return

            next_time = (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat()
            updates = {
                "next_notify_at": next_time,
                "last_bumped_at": datetime.now(timezone.utc).isoformat()
            }

            if await self.update_single_bot_setting(after.guild.id, bot_id_str, updates):
                await after.add_reaction("✅")

    @bump_check_loop.before_loop
    async def before_bump_loop(self):
        await self.bot.wait_until_ready()

async def setup(bot):
    await bot.add_cog(BumpsCog(bot))