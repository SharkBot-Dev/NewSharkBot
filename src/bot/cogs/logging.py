import logging
import discord
from discord.ext import commands

class LoggingCog(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    async def _get_or_create_webhook(self, guild: discord.Guild, event_config, event_name: str):
        channel_id_str = str(event_config.log_channel_id)
        
        if event_config.webhook_url:
            return event_config.webhook_url

        all_event_names = [
            "message_delete", "message_edit", "member_kick", "member_ban", 
            "channel_create", "channel_delete", "role_create", "role_delete"
        ]
        for name in all_event_names:
            if name == event_name: continue
            config = await self.bot.api.get_event_config(str(guild.id), name)
            if config and str(config.log_channel_id) == channel_id_str and config.webhook_url:
                save_data = {
                    "event_name": event_name,
                    "log_channel_id": channel_id_str,
                    "webhook_url": config.webhook_url,
                    "ignored_channels": event_config.ignored_channels
                }
                await self.bot.api.set_logging_event(str(guild.id), event_name, save_data)
                return config.webhook_url

        log_channel = guild.get_channel(int(channel_id_str))
        if not log_channel:
            return None

        try:
            existing_webhooks = await log_channel.webhooks()
            webhook = discord.utils.get(existing_webhooks, name="SharkBot-Logging")
            
            if not webhook:
                webhook = await log_channel.create_webhook(name="SharkBot-Logging")
            
            webhook_url = webhook.url
            save_data = {
                "event_name": event_name,
                "log_channel_id": channel_id_str,
                "webhook_url": webhook_url,
                "ignored_channels": event_config.ignored_channels
            }
            await self.bot.api.set_logging_event(str(guild.id), event_name, save_data)
            return webhook_url
        except Exception as e:
            logging.error(f"Webhook Error: {e}")
            return None

    async def _process_log(self, guild: discord.Guild, event_name: str, embed: discord.Embed, trigger_channel_id: str = None):
        if not guild: return

        is_enabled = await self.bot.api.is_module_enabled(str(guild.id), "logging")
        if not is_enabled or not is_enabled.get('enabled'):
            return

        config = await self.bot.api.get_logging_setting(str(guild.id))
        if not config:
            return

        if trigger_channel_id:
            ignored = config.global_ignored_channels or []
            if trigger_channel_id in ignored:
                return

        event_config = await self.bot.api.get_event_config(str(guild.id), event_name)
        if not event_config or not self.bot.api._is_valid_discord_id(event_config.log_channel_id):
            return
        
        if trigger_channel_id:
            ignored = event_config.ignored_channels or []
            if trigger_channel_id in ignored:
                return

        webhook_url = await self._get_or_create_webhook(guild, event_config, event_name)
        if not webhook_url:
            return

        webhook = discord.Webhook.from_url(webhook_url, session=self.bot.session)
        await webhook.send(
            embed=embed, 
            username=f"{guild.me.display_name} Logging", 
            avatar_url=guild.me.display_avatar.url
        )

    @commands.Cog.listener("on_message_delete")
    async def on_message_delete(self, message: discord.Message):
        if message.author.bot or not message.guild or not message.content:
            return

        embed = discord.Embed(title="🗑️ メッセージ削除", color=discord.Color.red(), timestamp=message.created_at)
        embed.add_field(name="送信者", value=f"{message.author.mention} (`{message.author.id}`)")
        embed.add_field(name="チャンネル", value=message.channel.mention)
        embed.add_field(name="内容", value=message.content, inline=False)
        
        await self._process_log(message.guild, "message_delete", embed, str(message.channel.id))

    @commands.Cog.listener("on_message_edit")
    async def on_message_edit(self, before: discord.Message, after: discord.Message):
        if before.author.bot or before.content == after.content or not after.content:
            return

        embed = discord.Embed(title="📝 メッセージ編集", color=discord.Color.blue(), timestamp=after.edited_at or after.created_at)
        embed.add_field(name="送信者", value=f"{before.author.mention} (`{before.author.id}`)")
        embed.add_field(name="チャンネル", value=before.channel.mention)
        embed.add_field(name="変更前", value=before.content, inline=False)
        embed.add_field(name="変更後", value=after.content, inline=False)

        await self._process_log(before.guild, "message_edit", embed, str(before.channel.id))

    @commands.Cog.listener("on_audit_log_entry_create")
    async def on_audit_log_entry_create(self, entry: discord.AuditLogEntry):
        if entry.user.bot: return

        guild = entry.guild
        action = entry.action
        embed = discord.Embed(timestamp=discord.utils.utcnow())
        event_key = ""

        # アクション判定
        if action == discord.AuditLogAction.kick:
            event_key = "member_kick"
            embed.title = "👢 メンバーキック"
            embed.color = discord.Color.red()
            embed.add_field(name="対象者", value=f"<@{entry.target.id}> (`{entry.target.id}`)")
        
        elif action == discord.AuditLogAction.ban:
            event_key = "member_ban"
            embed.title = "🔨 メンバーBAN"
            embed.color = discord.Color.dark_red()
            embed.add_field(name="対象者", value=f"<@{entry.target.id}> (`{entry.target.id}`)")

        elif action == discord.AuditLogAction.channel_create:
            event_key = "channel_create"
            embed.title = "📺 チャンネル作成"
            embed.color = discord.Color.green()
            embed.add_field(name="チャンネル", value=f"{entry.target.name}")

        elif action == discord.AuditLogAction.channel_delete:
            event_key = "channel_delete"
            embed.title = "📺 チャンネル削除"
            embed.color = discord.Color.red()

        elif action == discord.AuditLogAction.role_create:
            event_key = "role_create"
            embed.title = "➕ ロール作成"
            embed.color = discord.Color.green()
            embed.add_field(name="ロール名", value=f"{entry.target.name}")

        elif action == discord.AuditLogAction.role_delete:
            event_key = "role_delete"
            embed.title = "🗑️ ロール削除"
            embed.color = discord.Color.red()

        if event_key:
            embed.add_field(name="実行者", value=f"{entry.user.mention}")
            if entry.reason:
                embed.add_field(name="理由", value=entry.reason, inline=False)
            await self._process_log(guild, event_key, embed)

async def setup(bot):
    await bot.add_cog(LoggingCog(bot))