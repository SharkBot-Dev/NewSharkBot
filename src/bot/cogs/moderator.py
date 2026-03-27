import asyncio
import datetime
import discord
from discord.ext import commands
from typing import Dict, Any, List
import re

class ModeratorCog(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        self.settings_cache: Dict[str, Dict[str, Any]] = {}
        self.automod_cache: Dict[str, Dict[str, Any]] = {}

    async def send_mod_log(self, guild: discord.Guild, user: discord.User, action: str, reason: str, message_content: str = ""):
        basic_setting = await self.bot.api.get_moderator_settings(str(guild.id))
        if not basic_setting or not basic_setting.get("log_channel_id"):
            return

        log_channel = guild.get_channel(int(basic_setting["log_channel_id"]))
        if not log_channel:
            return

        embed = discord.Embed(title="AutoModログ", color=discord.Color.orange())
        embed.add_field(name="対象ユーザー", value=f"{user.mention} ({user.id})", inline=False)
        embed.add_field(name="実行アクション", value=action, inline=True)
        embed.add_field(name="理由", value=reason, inline=True)
        if message_content:
            embed.set_footer(text=f"Guild ID: {guild.id}")
        
        await log_channel.send(embed=embed)

    @commands.Cog.listener()
    async def on_message(self, message: discord.Message):
        if message.author.bot or not message.guild:
            return

        guild_id = str(message.guild.id)

        if not self.bot.api:
            return

        is_enabled = await self.bot.api.is_module_enabled(guild_id, "moderator")
        if not is_enabled:
            return

        if not is_enabled.get('enabled'):
            return

        try:
            automod_map = await self.bot.api.get_all_automod_settings(guild_id)
        except:
            automod_map = None

        if not automod_map:
            return

        if "badword" in automod_map:
            config = automod_map["badword"]
            if not self._is_whitelisted(message, config):
                for word in config.get("badwords", []):
                    if word and word in message.content:
                        await self.execute_automod(message, config, "NGワード検知", f"禁止ワード: {word}")
                        return 

        if "invite" in automod_map:
            config = automod_map["invite"]
            if "discord.gg/" in message.content or "discord.com/invite/" in message.content:
                if not self._is_whitelisted(message, config):
                    await self.execute_automod(message, config, "招待リンク検知", "許可されていない招待リンク")
                    return

        if "spoiler" in automod_map:
            config = automod_map["spoiler"]
            spoiler_count = message.content.count("||") // 2
            if spoiler_count >= 3:
                if not self._is_whitelisted(message, config):
                    await self.execute_automod(message, config, "大量ネタバレ検知", f"ネタバレタグ数: {spoiler_count}")
                    return

        if "badlink" in automod_map:
            config = automod_map["badlink"]
            if "http://" in message.content or "https://" in message.content:
                if not self._is_whitelisted(message, config):
                    allowed_domains = config.get("allowed_links", [])
                    
                    urls = re.findall(r'https?://[\w/:%#\$&\?\(\)~\.=\+\-]+', message.content)
                    
                    for url in urls:
                        is_allowed = any(domain in url for domain in allowed_domains)
                        if not is_allowed:
                            await self.execute_automod(message, config, "未許可リンク検知", f"URL: {url}")
                            return

    def _is_whitelisted(self, message: discord.Message, config: Dict):
        if str(message.channel.id) in config.get("whitelist_channel_ids", []):
            return True
        user_roles = [str(role.id) for role in message.author.roles]
        if any(role_id in config.get("whitelist_role_ids", []) for role_id in user_roles):
            return True
        return False

    async def execute_automod(self, message: discord.Message, config: Dict, reason: str, detail: str):
        actions = config.get("actions", [])

        if not actions:
            return
        
        if "delete" in actions:
            try:
                await message.delete()
            except:
                pass

        if "warn" in actions:
            await message.channel.send(f"{message.author.mention} あなたは処罰されました。\n理由: {reason} ({detail})", delete_after=5)

        if "timeout" in actions:
            try:
                await message.author.timeout(discord.utils.utcnow() + datetime.timedelta(minutes=10), reason=reason)
            except:
                pass

        await self.send_mod_log(message.guild, message.author, ", ".join(actions), f"{reason} ({detail})", message.content)

async def setup(bot):
    await bot.add_cog(ModeratorCog(bot))