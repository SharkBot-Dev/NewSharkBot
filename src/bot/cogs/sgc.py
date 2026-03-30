import json
import logging
import os

from discord.ext import commands
import discord
import asyncio
from typing import Optional

# main, lib.command は既存の環境に従うものとします
from main import NewSharkBot

class SuperGlobalChatCog(commands.Cog):
    def __init__(self, bot: NewSharkBot):
        self.bot = bot
        self.msg_expiry = 86400
        self.DEBUG = 707158343952629780
        self.MAIN = 707158257818664991
        print("init -> SuperGlobalChatCog")

    def filter_global(self, content: str) -> bool:
        blocked_words = [
            "discord.com", "discord.gg", "x.gd", "shorturl.asia",
            "tiny.cc", "everyone", "here",
        ]
        return not any(word in content for word in blocked_words)

    # Json作成
    async def sgc_make_json(self, message: discord.Message):
        dic = {
            "type": "message",
            "userId": str(message.author.id),
            "userName": message.author.name,
            "x-userGlobal_name": getattr(message.author, "global_name", message.author.name),
            "userDiscriminator": message.author.discriminator,
            "userAvatar": str(message.author.display_avatar.key) if message.author.avatar else None,
            "isBot": message.author.bot,
            "guildId": str(message.guild.id) if message.guild else None,
            "guildName": message.guild.name if message.guild else "DM",
            "guildIcon": str(message.guild.icon.key) if message.guild and message.guild.icon else None,
            "channelId": str(message.channel.id),
            "channelName": getattr(message.channel, "name", "DM"),
            "messageId": str(message.id),
            "content": message.content.replace("@", "＠")
        }

        if message.attachments:
            dic["attachmentsUrl"] = [a.url for a in message.attachments]

        if message.author.primary_guild.tag:
            dic["x-userPrimaryGuild"] = {
                "badge": message.author.primary_guild.badge.key,
                "tag": message.author.primary_guild.tag,
                "id": str(message.author.primary_guild.id)
            }

        if message.reference:
            try:
                reference_msg = message.reference.resolved
                if not isinstance(reference_msg, discord.Message):
                    reference_msg = await message.channel.fetch_message(message.reference.message_id)
                
                reference_mid = "0"
                
                if reference_msg.application_id == self.bot.user.id:
                    author_name = reference_msg.author.display_name
                    if "(" in author_name and author_name.endswith(")"):
                        reference_mid = author_name.split("(")[-1].rstrip(")")
                                
                else:
                    reference_mid = str(reference_msg.id)

                dic.update({"reference": reference_mid})
            except Exception:
                pass

        return json.dumps(dic, ensure_ascii=False)

    def sgc_delete_json(self, mid: str):
        dic = {}
        dic["type"] = "delete"
        dic["messageId"] = str(mid)

        return json.dumps(dic, ensure_ascii=False)
    
    def sgc_edit_json(self, mid: str, content: str):
        dic = {}
        dic["type"] = "edit"
        dic["messageId"] = str(mid)
        dic["content"] = content

        return json.dumps(dic, ensure_ascii=False)

    @commands.Cog.listener()
    async def on_message_edit(self, before: discord.Message, after: discord.Message):
        if after.author.bot or not self.bot.redis:
            return

        config = await self.bot.api.globalchat_get_channel_config(after.channel.id)
        if not config or not config.get("room"):
            return

        name = config["room"].get('name')
        if name not in ["sgc", "dsgc"]:
            return

        data = await self.bot.redis.get(f"gc:{name}:msg:{after.id}")
        if not data:
            return

        if name == "sgc":
            await self.bot.get_channel(self.MAIN).send(self.sgc_edit_json(after.id, after.content))
        elif name == "dsgc":
            await self.bot.get_channel(self.DEBUG).send(self.sgc_edit_json(after.id, after.content))

        destinations = json.loads(data)
        tasks = [self._edit_webhook_message(dest, after) for dest in destinations]
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)

    async def _edit_webhook_message(self, dest: dict, message: discord.Message):
        try:
            webhook = discord.Webhook.from_url(dest["webhook_url"], session=self.bot.session)
            await webhook.edit_message(
                int(dest["message_id"]),
                content=message.clean_content or " ",
            )
        except Exception as e:
            logging.error(f"Edit failed for {dest['message_id']}: {e}")

    @commands.Cog.listener()
    async def on_raw_message_delete(self, payload: discord.RawMessageDeleteEvent):
        if not self.bot.redis:
            return

        config = await self.bot.api.globalchat_get_channel_config(payload.channel_id)
        if not config or not config.get("room"):
            return

        name = config["room"].get('name')
        if name not in ["sgc", "dsgc"]:
            return

        data = await self.bot.redis.get(f"gc:{name}:msg:{payload.message_id}")
        if not data:
            return

        if name == "sgc":
            await self.bot.get_channel(self.MAIN).send(self.sgc_delete_json(payload.message_id))
        elif name == "dsgc":
            await self.bot.get_channel(self.DEBUG).send(self.sgc_delete_json(payload.message_id))

        destinations = json.loads(data)
        tasks = [self._delete_webhook_message(dest) for dest in destinations]
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)
        
        await self.bot.redis.delete(f"gc:{name}:msg:{payload.message_id}")

    async def _delete_webhook_message(self, dest: dict):
        try:
            webhook = discord.Webhook.from_url(dest["webhook_url"], session=self.bot.session)
            await webhook.delete_message(int(dest["message_id"]))
        except (discord.NotFound, discord.Forbidden):
            pass
        except Exception as e:
            logging.error(f"Delete failed for {dest['message_id']}: {e}")

    @commands.Cog.listener("on_message")
    async def on_message_others_bot(self, message: discord.Message):
        # 自分の送信したJSONメッセージを他のBOT経由で受け取った際の処理
        if not message.guild or message.author.id == self.bot.user.id:
            return

        channelId = message.channel.id
        if channelId == self.DEBUG:
            name = "dsgc"
        elif channelId == self.MAIN:
            name = "sgc"
        else:
            return
        
        try:
            dic = json.loads(message.content)
        except: 
            return

        m_type = dic.get("type")
        
        if m_type == "message":
            # 返信元の検索
            ref_mid = dic.get("reference")

            ref_author = None
            ref_content = None
            if ref_mid and ref_mid != "0":
                async for past_message in message.channel.history(limit=100):
                    try:
                        p_dic = json.loads(past_message.content)
                        if p_dic.get("messageId") == str(ref_mid):
                            ref_author = f"{p_dic.get('userName')}#{p_dic.get('userDiscriminator')}"
                            ref_content = p_dic.get("content", "内容なし")
                            break
                    except: continue

            channels_config = await self.bot.api.globalchat_get_active_channel_ids_byname(name)
            if channels_config:
                await self.relay_message(
                    message, 
                    channels_config, 
                    {"name": name}, 
                    isother_bot=True, 
                    sgc_data=dic,
                    ref_info={"author": ref_author, "content": ref_content}
                )

            await message.add_reaction("✅")
            
        elif m_type == "edit":
            data = await self.bot.redis.get(f"gc:{name}:msg:{dic.get('messageId')}")
            if data:
                destinations = json.loads(data)
                tasks = []
                for dest in destinations:
                    # 疑似Messageオブジェクトを作成してeditに渡す
                    mock_msg = type('MockMessage', (), {'clean_content': dic.get('content')})()
                    tasks.append(self._edit_webhook_message(dest, mock_msg))
                await asyncio.gather(*tasks, return_exceptions=True)

            await message.add_reaction("✅")

        elif m_type == "delete":
            msg_id = dic.get('messageId')
            data = await self.bot.redis.get(f"gc:{name}:msg:{msg_id}")
            if data:
                destinations = json.loads(data)
                tasks = [self._delete_webhook_message(dest) for dest in destinations]
                await asyncio.gather(*tasks, return_exceptions=True)
                await self.bot.redis.delete(f"gc:{name}:msg:{msg_id}")

            await message.add_reaction("✅")

    @commands.Cog.listener("on_message")
    async def on_message_sharkbot(self, message: discord.Message):
        if message.author.bot or message.is_system() or not message.guild:
            return

        config = await self.bot.api.globalchat_get_channel_config(message.channel.id)
        if not config or not config.get("room"):
            return

        room = config["room"]
        name = room.get('name')
        if name not in ["sgc", "dsgc"]:
            return

        # 制限チェック
        for res in room.get("restrictions", []):
            if res["target_id"] == str(message.author.id) and res["type"] in ["ban_user", "mute_user"]:
                await message.add_reaction("❌")
                return
            if res["target_id"] == str(message.guild.id) and res["type"] == "ban_server":
                await message.add_reaction("❌")
                return
            
        # アカウント作成日数チェック
        min_age_days = room.get("min_account_age", 0)
        if min_age_days > 0:
            delta = discord.utils.utcnow() - message.author.created_at
            if delta.days < min_age_days:
                return

        # スローモードチェック
        slowmode = room.get("slowmode", 0)
        if slowmode > 0:
            res = await self.bot.api.check_globalchat_cooldown(name, str(message.author.id), slowmode)
            if res.get("status") == "limit":
                await message.add_reaction("⏳")
                return

        channels_config = await self.bot.api.globalchat_get_active_channel_ids_byname(name)
        if not channels_config:
            return
            
        # 初回参加メッセージ
        member_ids = [m["user_id"] for m in channels_config.get("members", [])]
        if str(message.author.id) not in member_ids:
            await self.bot.api.globalchat_join_member(name, str(message.author.id))
            rule = room.get("rule")
            description = room.get("description")
            if rule or description:
                embed = discord.Embed(title=f"{name} へようこそ！", description="ルールを確認してください。", color=discord.Color.blue())
                if description: embed.add_field(name="説明", value=description, inline=False)
                if rule: embed.add_field(name="ルール", value=rule, inline=False)
                await message.channel.send(content=message.author.mention, embed=embed)
                return
            
        # JSONを中継用チャンネルに送信
        js_content = await self.sgc_make_json(message)
        relay_channel_id = self.DEBUG if name == "dsgc" else self.MAIN
        relay_channel = self.bot.get_channel(relay_channel_id)
        if relay_channel:
            await relay_channel.send(content=js_content, allowed_mentions=discord.AllowedMentions.none())

        await self.relay_message(message, channels_config, room, isother_bot=False)

    async def check_and_fix_webhook(self, channel_info: dict) -> Optional[str]:
        guild_id = int(channel_info["guild_id"])
        channel_id = int(channel_info["channel_id"])
        
        guild = self.bot.get_guild(guild_id)
        if not guild: return None
        channel_obj = guild.get_channel(channel_id)
        if not channel_obj: return None

        try:
            webhooks = await channel_obj.webhooks()
            webhook = discord.utils.get(webhooks, name="SharkBot-GlobalChat")
            if not webhook:
                webhook = await channel_obj.create_webhook(name="SharkBot-GlobalChat")

            await self.bot.api.globalchat_update_connect_channel(
                channel_id=str(channel_id),
                guild_id=str(guild_id),
                room_name=channel_info["room_name"],
                webhook_url=webhook.url
            )
            return webhook.url
        except:
            return None

    async def relay_message(self, message: discord.Message, config: dict, room: dict, isother_bot: bool = False, sgc_data: dict = None, ref_info: dict = None):
        if not config: return
        
        name = room.get('name')
        destinations = config.get('connections', [])
        tasks = []

        origin_id = str(sgc_data.get("channelId")) if (isother_bot and sgc_data) else str(message.channel.id)

        for dest in destinations:
            if str(dest["channel_id"]) == origin_id:
                continue

            url = dest.get("webhook_url") or await self.check_and_fix_webhook(dest)
            if url:
                tasks.append(self.send_webhook(url, message, isother_bot, sgc_data, ref_info))

        if not tasks: return

        results = await asyncio.gather(*tasks, return_exceptions=True)

        synced_data = [res for res in results if isinstance(res, dict)]
        if synced_data:
            msg_id = sgc_data.get("messageId") if (isother_bot and sgc_data) else message.id
            await self.bot.redis.set(f"gc:{name}:msg:{msg_id}", json.dumps(synced_data), ex=self.msg_expiry)

    async def send_webhook(self, url: str, message: discord.Message, isother_bot: bool, sgc_data: dict = None, ref_info: dict = None):
        if not url.startswith("https://discord.com/api/webhooks/"):
            return

        webhook = discord.Webhook.from_url(url, session=self.bot.session)
        embeds = []

        # 他BOTからの転送メッセージ(sgc_data)か、自サーバーのメッセージかで取得先を変える
        if isother_bot and sgc_data:
            author_name = sgc_data.get("userName")
            author_id = sgc_data.get("userId")
            avatar = sgc_data.get("userAvatar")
            author_avatar = f"https://cdn.discordapp.com/avatars/{author_id}/{avatar}.png?size=1024"
            guild_name = sgc_data.get("guildName")
            content = sgc_data.get("content")
            msg_id = sgc_data.get('messageId')
            if ref_info:
                if ref_info.get('author') and ref_info.get('author'):
                        
                    re_embed = discord.Embed(
                        description=f"**{ref_info['author']}** に返信:\n> {ref_info['content']}", 
                        color=discord.Color.light_grey()
                    )
                    embeds.append(re_embed)

            for img_url in sgc_data.get("attachmentsUrl", []):
                embeds.append(discord.Embed(color=0x007bff).set_image(url=img_url))
        else:
            author_name = message.author.name
            author_id = message.author.id
            author_avatar = message.author.display_avatar.url
            guild_name = message.guild.name
            content = message.clean_content
            msg_id = message.id
            # 通常の返信処理
            if message.reference and isinstance(message.reference.resolved, discord.Message):
                parent = message.reference.resolved
                p_text = (parent.clean_content[:97] + "...") if len(parent.clean_content) > 100 else (parent.clean_content or "[画像/埋め込み]")
                re_embed = discord.Embed(description=f"**{parent.author.display_name}** に返信:\n> {p_text}", color=discord.Color.light_grey())
                embeds.append(re_embed)

        # 添付画像 embed
        if message.attachments:
            for a in message.attachments:
                if a.content_type and a.content_type.startswith("image/"):
                    embeds.append(discord.Embed(color=0x007bff).set_image(url=a.url))

        try:
            sent_msg = await webhook.send(
                content=content or " ",
                username=f"{author_name} [{guild_name}] ({msg_id})",
                avatar_url=author_avatar,
                embeds=embeds[:5],
                allowed_mentions=discord.AllowedMentions.none(),
                wait=True
            )
            return {"webhook_url": url, "message_id": str(sent_msg.id)}
        except Exception as e:
            return None

async def setup(bot):
    await bot.add_cog(SuperGlobalChatCog(bot))