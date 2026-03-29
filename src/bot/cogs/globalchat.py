import logging

from discord.ext import commands
import discord
import asyncio
from typing import Optional

class GlobalChatCog(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        print("init -> GlobalChatCog")

    @commands.Cog.listener()
    async def on_message(self, message: discord.Message):
        if message.author.bot or message.is_system():
            return

        config = await self.bot.api.globalchat_get_channel_config(message.channel.id)
        if not config or not config.get("room"):
            return

        room = config["room"]

        for res in room.get("restrictions", []):
            if res["target_id"] == str(message.author.id) and res["type"] in ["ban_user", "mute_user"]:
                return
            if res["target_id"] == str(message.guild.id) and res["type"] == "ban_server":
                return
            
        min_age_days = room.get("min_account_age", 0)
        if min_age_days > 0:
            delta = discord.utils.utcnow() - message.author.created_at
            if delta.days < min_age_days:
                return

        slowmode = room.get("slowmode", 0)
        if slowmode > 0:
            res = await self.bot.api.check_globalchat_cooldown(
                room["name"], 
                str(message.author.id), 
                slowmode
            )
            
            if res["status"] == "limit":
                await message.add_reaction("⏳")
                return
            elif res["status"] == "error":
                logging.error(f"Cooldown API Error: {res.get('code')}")

        channels = await self.bot.api.globalchat_get_active_channel_ids_byname(room["name"])
            
        member_ids = [m["user_id"] for m in channels.get("members", [])]
        if str(message.author.id) not in member_ids:
            data = await self.bot.api.globalchat_join_member(room["name"], str(message.author.id))

            rule = room.get("rule")
            description = room.get("description")
            
            if rule or description:
                embed = discord.Embed(
                    title=f"{room['name']} へようこそ！",
                    description=f"ルールと説明を確認してください。\n再度送信するとルールに同意したものとします。",
                    color=discord.Color.blue()
                )
                if description:
                    embed.add_field(name="ルーム説明", value=description, inline=False)
                if rule:
                    embed.add_field(name="ルール", value=rule, inline=False)
                
                embed.set_footer(text="このメッセージは初回参加時のみ表示されます。")
                
                try:
                    await message.channel.send(content=message.author.mention, embed=embed)
                except Exception as e:
                    logging.error(f"Failed to send welcome message: {e}")

                return

        await self.relay_message(message, channels)

    async def check_and_fix_webhook(self, channel: dict) -> Optional[str]:
        guild_id = int(channel["guild_id"])
        channel_id = int(channel["channel_id"])
        webhook_url = channel.get("webhook_url")

        if not webhook_url or webhook_url == "":
            guild = self.bot.get_guild(guild_id)
            if not guild:
                logging.error(f"{guild_id} is NotFound")
                return
            channel_obj = guild.get_channel(channel_id)
            if not channel_obj:
                logging.error(f"{channel_id} is NotFound")
                return None

            try:
                webhooks = await channel_obj.webhooks()
                webhook = discord.utils.get(webhooks, name="SharkBot-GlobalChat")
                
                if not webhook:
                    webhook = await channel_obj.create_webhook(name="SharkBot-GlobalChat")

                await self.bot.api.globalchat_connect_channel(
                    channel_id=str(channel_id),
                    guild_id=str(channel_obj.guild.id),
                    room_name=channel["room_name"],
                    webhook_url=webhook.url
                )
                return webhook.url
            except Exception as e:
                await self.bot.api.globalchat_disconnect_channel(channel_id=str(channel_id))
                return None
        
        return webhook_url

    async def relay_message(self, message: discord.Message, config: dict):
        if config == {}:
            return

        logging.error(config)

        destinations = config.get('connections', [])

        tasks = []
        for dest in destinations:
            if str(dest["channel_id"]) == str(message.channel.id):
                continue

            url = dest.get("webhook_url")
            if not url or url == "":
                url = await self.check_and_fix_webhook(dest)

            if not url:
                continue

            tasks.append(asyncio.create_task(self.send_webhook(url, message)))

        if not tasks:
            return

        done, pending = await asyncio.wait(tasks, timeout=5.0)

        for task in done:
            try:
                await task
            except Exception as e:
                pass
        
        for p in pending:
            p.cancel()

    async def send_webhook(self, url: str, message: discord.Message):
        if not url.startswith("https://discord.com/api/webhooks/"):
            return

        webhook = discord.Webhook.from_url(url, session=self.bot.session)
        embeds = []

        if message.reference and isinstance(message.reference.resolved, discord.Message):
            parent = message.reference.resolved
            
            parent_text = parent.clean_content
            if len(parent_text) > 100:
                parent_text = parent_text[:97] + "..."
            
            reply_embed = discord.Embed(
                description=f"**{parent.author.display_name}** に返信:\n> {parent_text or '[画像/埋め込みのみ]'}",
                color=discord.Color.light_grey()
            )
            embeds.append(reply_embed)

        if message.attachments:
            for attachment in message.attachments:
                if attachment.content_type and attachment.content_type.startswith("image/"):
                    img_embed = discord.Embed(color=0x007bff)
                    img_embed.set_image(url=attachment.url)
                    embeds.append(img_embed)

        try:
            await webhook.send(
                content=message.clean_content or " ",
                username=f"{message.author.name} ({message.guild.name})",
                avatar_url=message.author.display_avatar.url,
                embeds=embeds[:5],
                allowed_mentions=discord.AllowedMentions.none()
            )
        except discord.NotFound:
            pass
        except Exception as e:
            print(f"[GlobalChat] Webhook send error: {e}")

async def setup(bot):
    await bot.add_cog(GlobalChatCog(bot))