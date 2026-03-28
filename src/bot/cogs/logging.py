import logging

from discord.ext import commands
import discord
import aiohttp

class LoggingCog(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    async def _handle_log_event(self, message: discord.Message, event_name: str, embed: discord.Embed):
        guild = message.guild
        if not guild:
            return

        is_enabled = await self.bot.api.is_module_enabled(str(message.guild.id), "logging")
        if not is_enabled:
            return
        
        if not is_enabled.get('enabled'):
            return

        event_config = await self.bot.api.get_event_config(str(guild.id), event_name)
        
        if not event_config or not self.bot.api._is_valid_discord_id(event_config.log_channel_id):
            return

        global_ignored = event_config.ignored_channels or []
        current_channel_id = str(message.channel.id)
        
        if current_channel_id in global_ignored:
            return

        if event_config.ignored_channels and str(message.channel.id) in event_config.ignored_channels:
            return

        channel_id = int(event_config.log_channel_id)
        webhook_url = event_config.webhook_url

        if not webhook_url:
            log_channel = guild.get_channel(channel_id)
            if not log_channel:
                return

            try:
                webhook = await log_channel.create_webhook(name=f"SharkBot-{event_name}")
                webhook_url = webhook.url

                # logging.error("Webhookが作成されました。")
                
                save_data = {
                    "event_name": event_name,
                    "log_channel_id": str(channel_id),
                    "webhook_url": webhook_url,
                    "ignored_channels": event_config.ignored_channels
                }
                await self.bot.api.set_logging_event(str(guild.id), event_name, save_data)
            except discord.Forbidden:
                return
            except Exception as e:
                print(f"Logging Error (Webhook Creation): {e}")
                return

        webhook = discord.Webhook.from_url(webhook_url, session=self.bot.session)
        await webhook.send(embed=embed, username=f"{message.guild.me.display_name} Logging", avatar_url=message.guild.me.display_avatar.url)

    @commands.Cog.listener("on_message_delete")
    async def on_message_delete(self, message: discord.Message):
        if message.author.bot or not message.guild:
            return
        
        if message.content == "":
            return

        embed = discord.Embed(title="🗑️ メッセージ削除", color=discord.Color.red(), timestamp=message.created_at)
        embed.add_field(name="送信者", value=f"{message.author.mention} (`{message.author.id}`)")
        embed.add_field(name="チャンネル", value=message.channel.mention)
        embed.add_field(name="内容", value=message.content or "（内容なし）", inline=False)
        
        await self._handle_log_event(message, "message_delete", embed)

    @commands.Cog.listener("on_message_edit")
    async def on_message_edit(self, before: discord.Message, after: discord.Message):
        if before.author.bot or before.content == after.content:
            return
        
        if after.content == "":
            return

        embed = discord.Embed(title="📝 メッセージ編集", color=discord.Color.orange(), timestamp=after.edited_at or after.created_at)
        embed.add_field(name="送信者", value=f"{before.author.mention} (`{before.author.id}`)")
        embed.add_field(name="チャンネル", value=before.channel.mention)
        embed.add_field(name="変更前", value=before.content or "（なし）", inline=False)
        embed.add_field(name="変更後", value=after.content or "（なし）", inline=False)

        await self._handle_log_event(before, "message_edit", embed)

async def setup(bot):
    await bot.add_cog(LoggingCog(bot))