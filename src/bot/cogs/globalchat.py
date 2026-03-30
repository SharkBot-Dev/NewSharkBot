import json
import logging
import os

from discord.ext import commands
import discord
import asyncio
from typing import Optional

from main import NewSharkBot
from lib.command import Command

class GlobalChatCog(commands.Cog):
    def __init__(self, bot: NewSharkBot):
        self.bot = bot

        connect = Command(name="connect", description="グローバルチャットに接続します。", module_name="グローバルチャット")
        connect.execute = self.connect_command
        self.bot.add_slashcommand(connect)

        self.msg_expiry = 86400

        print("init -> GlobalChatCog")

    async def connect_command(self, interaction: discord.Interaction, **kwargs):
        BACKEND_URL = os.environ.get("RESOURCE_API_BASE_URL", "http://localhost:8080")

        await interaction.response.defer()

        guild_id = str(interaction.guild_id)
        channel_id = str(interaction.channel.id)
        creator_id = str(interaction.user.id)

        config = await self.bot.api.globalchat_get_channel_config(channel_id)
        if config:
            if config.get("room"):
                await self.bot.api.globalchat_disconnect_channel(
                    channel_id=str(channel_id)
                )
                await interaction.followup.send("✅ グローバルチャットから退出しました。")
                return

        room_name = kwargs.get('name', "main")

        payload = {
            "channel_id": channel_id,
            "guild_id": guild_id,
            "name": room_name,
            "webhook_url": "",
            "creator_id": creator_id
        }

        try:
            async with self.bot.session.post(f"{BACKEND_URL}/globalchat/connect", 
                json=payload, 
                headers={"Content-Type": "application/json"}) as res:
                if res.status == 200:
                    await interaction.followup.send(f"✅ <#{channel_id}> をグローバルチャットに接続しました！")
                else:
                    error_data = await res.json()
                    error_msg = error_data.get("error", "不明なエラー")
                    logging.error(f"(Status: {res.status}): {error_msg}")
                    await interaction.followup.send(f"❌ 接続に失敗しました")

        except Exception as e:
            logging.error(f"GlobalChatError: {e}")
            await interaction.followup.send("⚠️ サーバーとの通信中にエラーが発生しました。")

    @commands.Cog.listener()
    async def on_message_edit(self, before: discord.Message, after: discord.Message):
        if after.author.bot or not self.bot.redis:
            return

        config = await self.bot.api.globalchat_get_channel_config(after.channel.id)
        if not config or not config.get("room"):
            return

        room = config["room"]
        name = room.get('name')

        if name in ["sgc", "dsgc"]:
            return

        data = await self.bot.redis.get(f"gc:{name}:msg:{after.id}")
        if not data:
            return

        destinations = json.loads(data)

        tasks = []
        for dest in destinations:
            tasks.append(self._edit_webhook_message(dest, after))

        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)

    async def _edit_webhook_message(self, dest: dict, message: discord.Message):
        try:
            webhook = discord.Webhook.from_url(dest["webhook_url"], session=self.bot.session)
            await webhook.edit_message(
                dest["message_id"],
                content=message.clean_content or " ",
            )
        except Exception as e:
            logging.error(f"Edit failed for {dest['message_id']}: {e}")

    @commands.Cog.listener()
    async def on_message_delete(self, message: discord.Message):
        if not self.bot.redis:
            return
        
        if not message.guild:
            return
        
        if message.author.bot:
            return

        config = await self.bot.api.globalchat_get_channel_config(message.channel.id)
        if not config or not config.get("room"):
            return

        room = config["room"]
        name = room.get('name')

        if name in ["sgc", "dsgc"]:
            return

        data = await self.bot.redis.get(f"gc:{name}:msg:{message.id}")
        if not data:
            return

        destinations = json.loads(data)

        tasks = []
        for dest in destinations:
            tasks.append(self._delete_webhook_message(dest))

        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)
        
        await self.bot.redis.delete(f"gc:{name}:msg:{message.id}")

    async def _delete_webhook_message(self, dest: dict):
        try:
            webhook = discord.Webhook.from_url(dest["webhook_url"], session=self.bot.session)
            await webhook.delete_message(dest["message_id"])
        except (discord.NotFound, discord.Forbidden):
            pass
        except Exception as e:
            logging.error(f"Delete failed for {dest['message_id']}: {e}")

    @commands.Cog.listener()
    async def on_message(self, message: discord.Message):
        if message.author.bot or message.is_system():
            return
        
        if not message.guild:
            return

        config = await self.bot.api.globalchat_get_channel_config(message.channel.id)
        if not config or not config.get("room"):
            return

        room = config["room"]
        name = room.get('name')

        if name in ["sgc", "dsgc"]:
            return

        for res in room.get("restrictions", []):
            if res["target_id"] == str(message.author.id) and res["type"] in ["ban_user", "mute_user"]:
                await message.add_reaction("❌")
                return
            if res["target_id"] == str(message.guild.id) and res["type"] == "ban_server":
                await message.add_reaction("❌")
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
        if not channels:
            logging.error("Failed to fetch globalchat room state: %s", room["name"])
            return
            
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

        await self.relay_message(message, channels, room)

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

                data = await self.bot.api.globalchat_update_connect_channel(
                    channel_id=str(channel_id),
                    guild_id=str(channel_obj.guild.id),
                    room_name=channel["room_name"],
                    webhook_url=webhook.url
                )
                
                return webhook.url
            except Exception as e:
                logging.error("Failed to refresh globalchat webhook for channel %s", channel_id)
                return None
        
        return webhook_url

    async def relay_message(self, message: discord.Message, config: dict, room: dict):
        if config == {}:
            return

        name = room.get('name')
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

            tasks.append(self.send_webhook(url, message))

        if not tasks:
            return

        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        synced_data = []
        for res in results:
            if isinstance(res, dict):
                synced_data.append(res)

        if synced_data:
            await self.bot.redis.set(
                f"gc:{name}:msg:{message.id}", 
                json.dumps(synced_data), 
                ex=self.msg_expiry
            )

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
            sent_msg = await webhook.send(
                content=message.clean_content or " ",
                username=f"{message.author.name} ({message.author.id}) [{message.guild.name}]",
                avatar_url=message.author.display_avatar.url,
                embeds=embeds[:5],
                allowed_mentions=discord.AllowedMentions.none(),
                wait=True
            )

            return {"webhook_url": url, "message_id": sent_msg.id}
        except discord.NotFound:
            pass
        except Exception as e:
            print(f"[GlobalChat] Webhook send error: {e}")

async def setup(bot):
    await bot.add_cog(GlobalChatCog(bot))