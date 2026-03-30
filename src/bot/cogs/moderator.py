import asyncio
import datetime
import discord
from discord.ext import commands
from typing import Dict, Any, List
import re

from lib.command import Command

STATUS_EMOJIS = {
    discord.Status.online: "<:online:1407922300535181423>",
    discord.Status.idle: "<:idle:1407922295711727729>",
    discord.Status.dnd: "<:dnd:1407922294130741348>",
    discord.Status.offline: "<:offline:1407922298563854496>",
}

class ModeratorCog(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

        kick = Command(name="kick", description="メンバーをキックします。", module_name="モデレーター")
        kick.execute = self.kick_command
        self.bot.add_slashcommand(kick)

        ban = Command(name="ban", description="ユーザーをBanします。", module_name="モデレーター")
        ban.execute = self.ban_command
        self.bot.add_slashcommand(ban)

        unban = Command(name="unban", description="ユーザーのBanを解除します。", module_name="モデレーター")
        unban.execute = self.unban_command
        self.bot.add_slashcommand(unban)

        timeout = Command(name="timeout", description="ユーザーをタイムアウトします。", module_name="モデレーター")
        timeout.execute = self.timeout_command
        self.bot.add_slashcommand(timeout)

        remove_timeout = Command(name="remove-timeout", description="ユーザーのタイムアウトを解除します。", module_name="モデレーター")
        remove_timeout.execute = self.remove_timeout_command
        self.bot.add_slashcommand(remove_timeout)

        clear = Command(name="clear", description="メッセージを複数個削除します。", module_name="モデレーター")
        clear.execute = self.clear_command
        self.bot.add_slashcommand(clear)

        warn = Command(name="warn", description="ユーザーを警告します。", module_name="モデレーター")
        warn.execute = self.warn_command
        self.bot.add_slashcommand(warn)

        user_info = Command(name="user-info", description="ユーザーの情報を取得します。", module_name="モデレーター")
        user_info.execute = self.user_info_command
        self.bot.add_slashcommand(user_info)

        role_info = Command(name="role-info", description="ロールの情報を表示します。", module_name="モデレーター")
        role_info.execute = self.role_info_command
        self.bot.add_slashcommand(role_info)

        server_info = Command(name="server-info", description="サーバーの情報を表示します。", module_name="モデレーター")
        server_info.execute = self.server_info_command
        self.bot.add_slashcommand(server_info)

        print("init -> ModeratorCog")

    def parse_duration(self, duration_str: str):
        regex = r"(\d+)\s*([dhms])"
        matches = re.findall(regex, duration_str.lower())
        
        if not matches:
            return None

        total_seconds = 0
        unit_seconds = {
            'd': 86400,
            'h': 3600,
            'm': 60,
            's': 1
        }

        for value, unit in matches:
            total_seconds += int(value) * unit_seconds[unit]

        return total_seconds

    def reason_parse(self, reason: str, moderator: discord.User, action: str):
        return f"{reason} | {moderator.name}により{action}。"

    async def kick_command(self, interaction: discord.Interaction, **kwargs):   
        await interaction.response.defer()
        
        guild = interaction.guild
        user_id = kwargs.get("member")
        reason = kwargs.get("reason", "なし")

        if not user_id:
            return await interaction.followup.send(content="ユーザーIDが指定されていません。")

        user = guild.get_member(int(user_id))
        if not user:
            return await interaction.followup.send(content="ユーザーが見つかりませんでした。")

        try:
            await user.kick(reason=self.reason_parse(reason, interaction.user, "キック"))
            await interaction.followup.send(content=f"🦶 {user.mention} をサーバーからキックしました。", allowed_mentions=discord.AllowedMentions.none())
        except discord.Forbidden:
            await interaction.followup.send(content="権限がありません。", allowed_mentions=discord.AllowedMentions.none())
            return
        except:
            await interaction.followup.send(content="キックに失敗しました。", allowed_mentions=discord.AllowedMentions.none())
            return
        
        await self.send_moderator_log(guild, interaction.user, user, "Kick", reason)
        
    async def ban_command(self, interaction: discord.Interaction, **kwargs):
        await interaction.response.defer()
        
        guild = interaction.guild
        user_id = kwargs.get("user")
        reason = kwargs.get("reason", "なし")

        if not user_id:
            return await interaction.followup.send(content="ユーザーIDが指定されていません。")

        user = await interaction.client.fetch_user(int(user_id))
        if not user:
            return await interaction.followup.send(content="ユーザーが見つかりませんでした。")

        try:
            await interaction.guild.ban(user, reason=self.reason_parse(reason, interaction.user, "Ban"))
            await interaction.followup.send(content=f"🔨 {user.mention} をサーバーからBanしました。", allowed_mentions=discord.AllowedMentions.none())
        except discord.Forbidden:
            await interaction.followup.send(content="権限がありません。", allowed_mentions=discord.AllowedMentions.none())
            return
        except:
            await interaction.followup.send(content="Banに失敗しました。", allowed_mentions=discord.AllowedMentions.none())
            return
        
        await self.send_moderator_log(guild, interaction.user, user, "Ban", reason)
        
    async def unban_command(self, interaction: discord.Interaction, **kwargs):
        await interaction.response.defer()

        guild = interaction.guild
        user_id = kwargs.get("user")
        reason = kwargs.get("reason", "なし")

        if not user_id:
            return await interaction.followup.send(content="ユーザーIDが指定されていません。")

        user = await interaction.client.fetch_user(int(user_id))
        if not user:
            return await interaction.followup.send(content="ユーザーが見つかりませんでした。")

        try:
            await interaction.guild.unban(user, reason=self.reason_parse(reason, interaction.user, "Ban解除"))
            await interaction.followup.send(content=f"😎 {user.mention} をBan解除しました。", allowed_mentions=discord.AllowedMentions.none())
        except discord.Forbidden:
            await interaction.followup.send(content="権限がありません。", allowed_mentions=discord.AllowedMentions.none())
            return
        except:
            await interaction.followup.send(content="Ban解除に失敗しました。", allowed_mentions=discord.AllowedMentions.none())
            return
        
        await self.send_moderator_log(guild, interaction.user, user, "Ban解除", reason)
        
    async def timeout_command(self, interaction: discord.Interaction, **kwargs):
        await interaction.response.defer()

        guild = interaction.guild
        user_id = kwargs.get("member")
        reason = kwargs.get("reason", "なし")
        duration = kwargs.get('duration')

        if not user_id:
            return await interaction.followup.send(content="ユーザーIDが指定されていません。")

        user = guild.get_member(int(user_id))
        if not user:
            return await interaction.followup.send(content="ユーザーが見つかりませんでした。")

        parse = self.parse_duration(duration)
        if not parse:
            return await interaction.followup.send(content="無効な時間を指定しています。\n\n例: `10d2m5s`", allowed_mentions=discord.AllowedMentions.none())

        try:
            await user.timeout(discord.utils.utcnow() + datetime.timedelta(seconds=parse), reason=self.reason_parse(reason, interaction.user, "タイムアウト"))
            await interaction.followup.send(content=f"⌚ {user.mention} をタイムアウトしました。", allowed_mentions=discord.AllowedMentions.none())
        except discord.Forbidden:
            await interaction.followup.send(content="権限がありません。", allowed_mentions=discord.AllowedMentions.none())
            return
        except:
            await interaction.followup.send(content="タイムアウトに失敗しました。", allowed_mentions=discord.AllowedMentions.none())
            return
        
        await self.send_moderator_log(guild, interaction.user, user, "タイムアウト", reason)

    async def remove_timeout_command(self, interaction: discord.Interaction, **kwargs):
        await interaction.response.defer()

        guild = interaction.guild
        user_id = kwargs.get("member")
        reason = kwargs.get("reason", "なし")

        if not user_id:
            return await interaction.followup.send(content="ユーザーIDが指定されていません。")

        user = guild.get_member(int(user_id))
        if not user:
            return await interaction.followup.send(content="ユーザーが見つかりませんでした。")

        try:
            await user.timeout(None, reason=self.reason_parse(reason, interaction.user, "タイムアウト解除"))
            await interaction.followup.send(content=f"⏳ {user.mention} のタイムアウトを解除しました。", allowed_mentions=discord.AllowedMentions.none())
        except discord.Forbidden:
            await interaction.followup.send(content="権限がありません。", allowed_mentions=discord.AllowedMentions.none())
            return
        except:
            await interaction.followup.send(content="タイムアウト解除に失敗しました。", allowed_mentions=discord.AllowedMentions.none())
            return

        await self.send_moderator_log(guild, interaction.user, user, "タイムアウト解除", reason)

    async def clear_command(self, interaction: discord.Interaction, **kwargs):
        await interaction.response.defer()

        guild = interaction.guild
        amount = kwargs.get("amount")

        try:
            amount_int = int(kwargs.get("amount"))
        except (TypeError, ValueError):
            return await interaction.followup.send(content="削除件数は 1〜100 の整数で指定してください。")

        if not 1 <= amount_int <= 100:
            return await interaction.followup.send(content="削除件数は 1〜100 の整数で指定してください。")
        
        seven_days_ago = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=7)

        deleted = await interaction.channel.purge(
            limit=amount_int, 
            after=seven_days_ago,
            oldest_first=False
        )

        await interaction.channel.send(f'{len(deleted)} 件のメッセージを削除しました。', delete_after=5)

    async def warn_command(self, interaction: discord.Interaction, **kwargs):
        await interaction.response.defer()

        guild = interaction.guild
        user = kwargs.get('user')
        reason = kwargs.get('reason', "なし")

        try:
            user = await guild.fetch_member(int(user))
            if not user:
                return await interaction.followup.send(content="ユーザーが見つかりませんでした。", allowed_mentions=discord.AllowedMentions.none())
        except:
            return await interaction.followup.send(content="ユーザーが見つかりませんでした。")

        await interaction.followup.send(content=f"<@{user.id}>", embed=discord.Embed(title="あなたは警告されました。", description=reason, color=discord.Color.yellow()).set_author(name=user.name, icon_url=user.display_avatar.url))

    async def user_info_command(self, interaction: discord.Interaction, **kwargs):
        await interaction.response.defer()

        guild = interaction.guild
        user_id = kwargs.get("user", str(interaction.user.id))

        try:
            user = await interaction.client.fetch_user(int(user_id))
            if not user:
                return await interaction.followup.send(content="ユーザーが見つかりませんでした。", allowed_mentions=discord.AllowedMentions.none())
        except:
            return await interaction.followup.send(content="ユーザーが見つかりませんでした。")
            
        embed = discord.Embed(title=f"{user.name}の情報", color=discord.Color.blue())
        embed.set_thumbnail(url=user.display_avatar.url)
        embed.add_field(name="ユーザー名", value=user.name, inline=True)
        embed.add_field(name="ユーザーID", value=user.id, inline=True)
        embed.add_field(name="アカウント作成日", value=user.created_at.strftime("%Y-%m-%d %H:%M:%S"), inline=True)

        member = interaction.guild.get_member(int(user_id))
        if member:
            embed.add_field(name="サーバー参加日", value=member.joined_at.strftime("%Y-%m-%d %H:%M:%S"), inline=True)
            embed.add_field(name="ロール", value=", ".join([role.mention for role in member.roles]), inline=True)

            status = member.status
            emoji = STATUS_EMOJIS.get(status, "❔")
            embed.add_field(name="ステータス", value=f"{emoji} {status.name}", inline=True)
            
            platforms = []
            if member.desktop_status != discord.Status.offline:
                platforms.append("デスクトップ")
            if member.mobile_status != discord.Status.offline:
                platforms.append("スマホ")
            if member.web_status != discord.Status.offline:
                platforms.append("Web")
            
            embed.add_field(name="機種", value=", ".join(platforms) if platforms else "不明", inline=True)

            activity = member.activity
            if activity:
                embed.add_field(name="アクティビティ", value=activity.name, inline=True)

        await interaction.followup.send(embed=embed)

    async def role_info_command(self, interaction: discord.Interaction, **kwargs):
        await interaction.response.defer()

        role_id = kwargs.get("role")

        try:
            role = await interaction.guild.fetch_role(int(role_id))
            if not role:
                return await interaction.followup.send(content="ロール見つかりませんでした。", allowed_mentions=discord.AllowedMentions.none())
        except:
            return await interaction.followup.send(content="ロールが見つかりませんでした。")
        
        embed = discord.Embed(title=f"{role.name}の情報", color=discord.Color.blue())
        embed.add_field(name="名前", value=role.name, inline=False)
        embed.add_field(name="メンバー数", value=len(role.members))
        embed.add_field(name="作成日", value=role.created_at.strftime("%Y-%m-%d %H:%M:%S"))

        await interaction.followup.send(embed=embed)

    async def server_info_command(self, interaction: discord.Interaction, **kwargs):
        await interaction.response.defer()

        embed = discord.Embed(title=f"{interaction.guild.name}の情報", color=discord.Color.blue())
        embed.add_field(name="名前", value=interaction.guild.name, inline=False)
        embed.add_field(name="メンバー数", value=interaction.guild.member_count)
        embed.add_field(name="作成日", value=interaction.guild.created_at.strftime("%Y-%m-%d %H:%M:%S"))
        embed.add_field(name="オーナー", value=f"<@{interaction.guild.owner_id}>")

        if interaction.guild.icon:
            embed.set_thumbnail(url=interaction.guild.icon.url)

        await interaction.followup.send(embed=embed)

    async def send_moderator_log(self, guild: discord.Guild, moderator: discord.User, user: discord.User, action: str, reason: str):
        basic_setting = await self.bot.api.get_moderator_settings(str(guild.id))
        if not basic_setting or not basic_setting.get("log_channel_id"):
            return

        log_channel = guild.get_channel(int(basic_setting["log_channel_id"]))
        if not log_channel:
            return

        embed = discord.Embed(title="モデレーターログ", color=discord.Color.orange())
        embed.add_field(name="対象ユーザー", value=f"{user.mention} ({user.id})", inline=False)
        embed.add_field(name="実行ユーザー", value=f"{moderator.mention} ({moderator.id})", inline=False)
        embed.add_field(name="実行アクション", value=action, inline=True)
        embed.add_field(name="理由", value=reason, inline=True)
        embed.set_footer(text=f"Guild ID: {guild.id}")
        
        await log_channel.send(embed=embed)

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