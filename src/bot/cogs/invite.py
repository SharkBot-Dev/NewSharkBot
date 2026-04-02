import logging
import json
import discord
from discord.ext import commands
from lib import page
from main import NewSharkBot
from lib.command import Command

class InviteCog(commands.Cog):
    def __init__(self, bot: NewSharkBot):
        self.bot = bot

        create_invite_cmd = Command(
            name="create-invite",
            description="新規招待リンクを発行します。",
            module_name="招待リンク管理"
        )
        create_invite_cmd.execute = self.create_invite
        self.bot.add_slashcommand(create_invite_cmd)
    
        list_invite = Command(
            name="invites",
            description="招待リンク一覧を表示します。",
            module_name="招待リンク管理"
        )
        list_invite.execute = self.invites
        self.bot.add_slashcommand(list_invite)

        invites_list_cmd = Command(
            name="inviter",
            description="招待者のランキング一覧を表示します。",
            module_name="招待リンク管理"
        )
        invites_list_cmd.execute = self.invites_list
        self.bot.add_slashcommand(invites_list_cmd)

    def _get_cache_key(self, guild_id: int):
        return f"invites:{guild_id}"

    def _get_count_key(self, guild_id: int):
        return f"inviter_counts:{guild_id}"

    @commands.Cog.listener()
    async def on_ready(self):
        for guild in self.bot.guilds:
            is_enabled = await self.bot.api.is_module_enabled(str(guild.id), "invite")
            if not is_enabled or not is_enabled.get('enabled'):
                continue

            try:
                current_invites = await guild.invites()
                cache_key = self._get_cache_key(guild.id)
                
                old_invites = await self.bot.redis.hgetall(cache_key)
                
                new_cache_data = {}
                for invite in current_invites:
                    new_cache_data[invite.code] = invite.uses
                    
                    if invite.code in old_invites:
                        old_uses = int(old_invites[invite.code])
                        diff = invite.uses - old_uses
                        
                        if diff > 0 and invite.inviter:
                            await self.bot.redis.hincrby(
                                self._get_count_key(guild.id), 
                                str(invite.inviter.id), 
                                diff
                            )
                            logging.info(f"Offline catch-up: {invite.inviter} +{diff} invites in {guild.name}")

                if new_cache_data:
                    await self.bot.redis.delete(cache_key)
                    await self.bot.redis.hset(cache_key, mapping=new_cache_data)

            except Exception as e:
                logging.error(f"Error syncing invites on startup for {guild.id}: {e}")

    async def create_invite(self, interaction: discord.Interaction):
        await interaction.response.defer()
        invite = await interaction.channel.create_invite()
        
        await self.bot.redis.hset(self._get_cache_key(interaction.guild_id), invite.code, invite.uses or 0)
        
        await interaction.followup.send(invite.url)

    async def invites(self, interaction: discord.Interaction):
        await interaction.response.defer()
        
        guild = interaction.guild
        try:
            invites = await guild.invites()
        except discord.Forbidden:
            await interaction.followup.send("招待リンクを表示する権限がありません。")
            return

        if not invites:
            await self.bot.redis.delete(self._get_cache_key(guild.id))
            await interaction.followup.send("有効な招待リンクはありません。")
            return

        new_cache_data = {invite.code: invite.uses for invite in invites}
        await self.bot.redis.delete(self._get_cache_key(guild.id))
        await self.bot.redis.hset(self._get_cache_key(guild.id), mapping=new_cache_data)

        items_per_page = 5
        embeds = []
        total_pages = (len(invites) - 1) // items_per_page + 1
        
        for i in range(0, len(invites), items_per_page):
            chunk = invites[i:i + items_per_page]
            embed = discord.Embed(
                title=f"🔗 招待リンク一覧 ({len(invites)}件)",
                description="サーバー全体の有効なリンクを表示しています。",
                color=discord.Color.blue()
            )

            for invite in chunk:
                inviter = invite.inviter.mention if invite.inviter else "不明"
                uses_count = f"`{invite.uses} / {'∞' if invite.max_uses == 0 else invite.max_uses}`"
                
                expiry = "なし" if invite.max_age == 0 else f"<t:{int(invite.created_at.timestamp() + invite.max_age)}:R>"
                
                value = (
                    f"**コード**: `{invite.code}` ([リンク]({invite.url}))\n"
                    f"**作成者**: {inviter} | **チャンネル**: {invite.channel.mention}\n"
                    f"**使用数**: {uses_count} | **期限**: {expiry}"
                )
                embed.add_field(name=f"Invite: {invite.code}", value=value, inline=False)
            
            embed.set_footer(text=f"ページ {len(embeds) + 1} / {total_pages}")
            embeds.append(embed)

        view = page.PaginationView(embeds) 
        await interaction.followup.send(embed=embeds[0], view=view)

    async def invites_list(self, interaction: discord.Interaction):
        await interaction.response.defer()
        
        guild = interaction.guild
        try:
            invites = await guild.invites()
        except discord.Forbidden:
            await interaction.followup.send("招待リストを取得する権限（招待の管理）がありません。")
            return

        invite_counts = {}
        for invite in invites:
            if invite.inviter:
                user_id = invite.inviter.id
                invite_counts[user_id] = invite_counts.get(user_id, 0) + invite.uses

        if not invite_counts:
            await interaction.followup.send("有効な招待データが見つかりませんでした。")
            return

        sorted_invites = sorted(
            invite_counts.items(), 
            key=lambda x: x[1], 
            reverse=True
        )

        items_per_page = 10
        embeds = []
        total_pages = (len(sorted_invites) - 1) // items_per_page + 1

        for p in range(total_pages):
            start = p * items_per_page
            end = start + items_per_page
            chunk = sorted_invites[start:end]

            leaderboard = []
            for i, (user_id, count) in enumerate(chunk, start + 1):
                member = guild.get_member(user_id)
                name = member.display_name if member else f"不明なユーザー({user_id})"
                leaderboard.append(f"**{i}位**: {name} - `{count}` 回")

            embed = discord.Embed(
                title=f"🏆 {guild.name} 招待ランキング",
                description="\n".join(leaderboard),
                color=discord.Color.gold()
            )
            embed.set_footer(text=f"ページ {p + 1} / {total_pages} (合計: {len(sorted_invites)}名)")
            embeds.append(embed)

        view = page.PaginationView(embeds)
        await interaction.followup.send(embed=embeds[0], view=view)

    @commands.Cog.listener()
    async def on_invite_create(self, invite: discord.Invite):
        is_enabled = await self.bot.api.is_module_enabled(str(invite.guild.id), "invite")
        if not is_enabled or not is_enabled.get('enabled'):
            return

        if invite.guild:
            await self.bot.redis.hset(self._get_cache_key(invite.guild.id), invite.code, invite.uses or 0)

    def format_message(self, template: str, member: discord.Member, inviter: discord.User, count: int, code: str):
        return template \
            .replace("{ユーザー名}", member.display_name) \
            .replace("{ユーザーID}", str(member.id)) \
            .replace("{ユーザーメンション}", member.mention) \
            .replace("{招待者名}", inviter.display_name) \
            .replace("{招待者ID}", str(inviter.id)) \
            .replace("{招待者メンション}", inviter.mention) \
            .replace("{カウント}", str(count)) \
            .replace("{サーバー名}", member.guild.name) \
            .replace("{招待コード}", code) \
            .replace("{招待リンク}", f"https://discord.gg/{code}")

    @commands.Cog.listener()
    async def on_member_join(self, member: discord.Member):
        guild = member.guild
        is_enabled = await self.bot.api.is_module_enabled(str(guild.id), "invite")
        if not is_enabled or not is_enabled.get('enabled'):
            return

        try:
            new_invites = await guild.invites()
        except:
            return

        used_invite = None

        cache_key = self._get_cache_key(guild.id)
        old_invites = await self.bot.redis.hgetall(cache_key)

        if not old_invites:
            new_data = {invite.code: invite.uses for invite in new_invites}
            if new_data:
                await self.bot.redis.hset(cache_key, mapping=new_data)
            logging.error(f"Initialized invite cache for guild {guild.id}. Skipping join processing for this member.")
            return

        for invite in new_invites:
            old_uses = int(old_invites.get(invite.code, 0))
            if (invite.uses or 0) > old_uses:
                used_invite = invite
                break

        if not used_invite or not used_invite.inviter:
            return

        new_data = {invite.code: invite.uses for invite in new_invites}
        await self.bot.redis.delete(self._get_cache_key(guild.id))
        if new_data:
            await self.bot.redis.hset(self._get_cache_key(guild.id), mapping=new_data)

        if not used_invite or not used_invite.inviter:
            return

        inviter = used_invite.inviter
        
        count = await self.bot.redis.hincrby(self._get_count_key(guild.id), str(inviter.id), 1)

        try:
            setting = await self.bot.api.get_invite_setting(guild.id)
            if not setting or not setting.get("channel_id"):
                return

            channel = guild.get_channel(int(setting["channel_id"]))
            if not channel:
                return

            embed = None
            if setting.get('embed_id'):
                raw_data = await self.bot.embed.getEmbed(str(guild.id), int(setting['embed_id']))
                if raw_data:
                    target_embed = discord.Embed.from_dict(raw_data) if isinstance(raw_data, dict) else raw_data
                    embed = self.bot.embed._apply_placeholders_to_embed(target_embed, placeholders = {
                        "ユーザー名": member.display_name,
                        "ユーザーID": str(member.id),
                        "ユーザーメンション": member.mention,
                        "招待者名": inviter.display_name,
                        "招待者ID": str(inviter.id),
                        "招待者メンション": inviter.mention,
                        "カウント": str(count),
                        "招待コード": str(used_invite.code),
                        "招待リンク": str(used_invite.url),
                        "サーバー名": member.guild.name,
                    })

            content = None
            if setting.get('content'):
                content = self.format_message(setting.get('content'), member, inviter, count, used_invite.code)

            if content or embed:
                await channel.send(content=content, embed=embed)
        except Exception as e:
            logging.error(f"Error in on_member_join processing: {e}")

async def setup(bot):
    await bot.add_cog(InviteCog(bot))