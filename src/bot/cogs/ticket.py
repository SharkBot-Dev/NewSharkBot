import asyncio
import datetime
import io

from discord.ext import commands
import discord
import json
from typing import Dict, Any

class TicketCog(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        print("init -> TicketCog")

    @commands.Cog.listener("on_interaction")
    async def on_interaction_ticket_handler(self, interaction: discord.Interaction):
        if interaction.type != discord.InteractionType.component:
            return
        
        custom_id = interaction.data.get('custom_id', "")
        if not custom_id.startswith("ticket:"):
            return
        
        if not interaction.guild:
            return

        try:
            _, action, panel_id = custom_id.split(":")
        except ValueError:
            return

        await interaction.response.defer(ephemeral=True, thinking=True)

        try:
            settings_res = await self.bot.api.get_ticket_settings(str(interaction.guild_id))
            panels = settings_res.get("panels", [])

            panel_config = next((p for p in panels if p['id'] == panel_id), None)
        except Exception as e:
            await interaction.followup.send("チケットの設定が見つかりませんでした。", ephemeral=True)
            return

        if not panel_config:
            await interaction.followup.send("このパネルの設定が見つかりません。", ephemeral=True)
            return

        if action == "create":
            await self.handle_create_ticket(interaction, panel_config)
        elif action == "close":
            await self.handle_close_ticket(interaction, panel_config)
        elif action == "claim":
            await self.handle_claim_ticket(interaction, panel_config)
        elif action == "delete":
            await self.handle_delete_ticket(interaction, panel_config)
        elif action == "reopen":
            await self.handle_reopen_ticket(interaction, panel_config)

    async def handle_create_ticket(self, interaction: discord.Interaction, config: Dict[str, Any]):
        guild = interaction.guild
        user = interaction.user

        cooldown_key = f"ticket:{interaction.guild.id}:{config['id']}"
        cooldown_value = str(interaction.user.id)
        cooldown_seconds = config.get('cooldown', 60)

        res = await self.bot.api.cooldown_check(cooldown_key, cooldown_value, cooldown_seconds)

        if res["status"] == "limit":
            remaining = res.get("remaining", 0)
            return await interaction.followup.send(
                f"⚠️ クールダウン中です。あと {remaining} 秒待ってください。", 
                ephemeral=True
            )
        
        if res["status"] == "error":
            print(f"Cooldown check error: {res.get('code') or res.get('message')}")
            await interaction.followup.send(content="内部APIエラーが発生しました。", ephemeral=True)
            return

        category = guild.get_channel(int(config['categoryId'])) if config.get('categoryId') else None

        overwrites = {
            guild.default_role: discord.PermissionOverwrite(view_channel=False),
            user: discord.PermissionOverwrite(view_channel=True, send_messages=True, read_message_history=True)
        }

        staff_role_ids = config.get('staffRoleIds', [])
        for role_id in staff_role_ids:
            role = guild.get_role(int(role_id))
            if role:
                overwrites[role] = discord.PermissionOverwrite(view_channel=True, send_messages=True, read_message_history=True)

        channel_name = config.get('nameTemplate', "ticket-{ユーザー名}").replace("{ユーザー名}", user.name).replace("{ユーザーID}", str(user.id))

        try:
            ticket_channel = await guild.create_text_channel(
                name=channel_name,
                category=category,
                overwrites=overwrites,
                reason=f"Ticket created by {user.name}",
                topic=f"チケットオーナー:{user.id}",
            )
        except discord.Forbidden:
            await interaction.followup.send("Botにチャンネル作成権限がありません。", ephemeral=True)
            return

        inner_buttons_data = config.get('innerButtons', [])
        view = discord.ui.View(timeout=None)
        
        for btn in inner_buttons_data:
            style = discord.ButtonStyle(btn.get('style', 2))
            custom_id = f"ticket:{btn['action']}:{config['id']}"
            button = discord.ui.Button(label=btn['label'], emoji=btn.get('emoji'), style=style, custom_id=custom_id)
            view.add_item(button)

        mention_ids = config.get('mentionRoleIds') or []
        mentions = " ".join([f"<@&{rid}>" for rid in mention_ids])
        mentions = f"{interaction.user.mention} {mentions}"

        inner_content = config.get('innerContent')
        embed_inner_id = config.get('innerEmbedId')
        content_body = f"{mentions}\n{inner_content}".strip()
        send_kwargs = {
            "content": content_body if content_body else None,
            "view": view
        }

        if embed_inner_id:
            try:
                embed_data = await self.bot.embed.getEmbed(str(guild.id), int(embed_inner_id))
            except (ValueError, TypeError):
                embed_data = None

            if embed_data:
                send_kwargs["embed"] = discord.Embed.from_dict(embed_data)

        await ticket_channel.send(**send_kwargs)

        await interaction.followup.send(f"チケットを作成しました: {ticket_channel.mention}", ephemeral=True)

    async def handle_close_ticket(self, interaction: discord.Interaction, config: Dict[str, Any]):
        guild = interaction.guild
        channel = interaction.channel

        staff_role_ids = config.get('staffRoleIds') or []
        new_overwrites = {
            guild.default_role: discord.PermissionOverwrite(view_channel=False)
        }
        for rid in staff_role_ids:
            role = guild.get_role(int(rid))
            if role:
                new_overwrites[role] = discord.PermissionOverwrite(view_channel=True, send_messages=True)

        await channel.edit(overwrites=new_overwrites)

        final_embed = discord.Embed(
            title="🔒 クローズ完了",
            description="チケットをクローズしました。\n最初のメッセージのボタンを押すことで削除できます。",
            color=discord.Color.red()
        )

        await interaction.followup.send(embed=final_embed)

    async def handle_delete_ticket(self, interaction: discord.Interaction, config: Dict[str, Any]):
        channel = interaction.channel
        try:
            log_file = await self.generate_ticket_log(channel)

            log_channel_id = config.get('logChannelId')
            if log_channel_id:
                log_channel = interaction.guild.get_channel(int(log_channel_id))
                if log_channel:
                    embed = discord.Embed(
                        title="チケットログ記録",
                        description=f"**チケット:** {channel.name}\n**クローズ実行者:** {interaction.user.mention}",
                        color=discord.Color.dark_gray(),
                        timestamp=datetime.datetime.now()
                    )
                    await log_channel.send(embed=embed, file=log_file)
        except Exception as e:
            print(f"[TicketLogError] {e}")
            pass

        await interaction.followup.send("チャンネルを削除しています...", ephemeral=True)
        await asyncio.sleep(3)
        await interaction.channel.delete(reason=f"Ticket deleted by {interaction.user}")

    async def handle_claim_ticket(self, interaction: discord.Interaction, config: Dict[str, Any]):
        embed = discord.Embed(
            description=f"{interaction.user.mention} がこのチケットを担当します。",
            color=discord.Color.green()
        )
        await interaction.channel.send(embed=embed)
        await interaction.followup.send("担当者に登録しました。", ephemeral=True)

    async def generate_ticket_log(self, channel: discord.TextChannel) -> discord.File:
        messages = []
        async for msg in channel.history(limit=100, oldest_first=True):
            timestamp = msg.created_at.strftime('%Y-%m-%d %H:%M:%S')
            content = msg.clean_content if msg.clean_content else "[画像/埋め込みのみ]"
            messages.append(f"[{timestamp}] {msg.author.name} ({msg.author.id}): {content}")

        log_data = "\n".join(messages)
        buffer = io.BytesIO(log_data.encode('utf-8'))
        
        return discord.File(fp=buffer, filename=f"log-{channel.name}-{datetime.date.today()}.txt")

    async def handle_reopen_ticket(self, interaction: discord.Interaction, config: Dict[str, Any]):
        guild = interaction.guild
        channel = interaction.channel
        
        staff_role_ids = config.get('staffRoleIds', [])
        
        if channel.topic and channel.topic.startswith("チケットオーナー:"):
            try:
                creator_id = int(channel.topic.removeprefix("チケットオーナー:"))
            except ValueError:
                creator_id = None
            if creator_id is not None:
                creator = guild.get_member(creator_id)
        else:
            async for message in channel.history(limit=1, oldest_first=True):
                if message.mentions:
                    creator = message.mentions[0]
        
        new_overwrites = {
            guild.default_role: discord.PermissionOverwrite(view_channel=False)
        }
        
        if creator:
            new_overwrites[creator] = discord.PermissionOverwrite(
                view_channel=True, send_messages=True, read_message_history=True
            )
            
        for rid in staff_role_ids:
            role = guild.get_role(int(rid))
            if role:
                new_overwrites[role] = discord.PermissionOverwrite(
                    view_channel=True, send_messages=True, read_message_history=True
                )

        await channel.edit(overwrites=new_overwrites, reason=f"Ticket reopened by {interaction.user}")

        embed = discord.Embed(
            title="🔓 チケットが再開されました",
            description=f"{interaction.user.mention} によりチケットが再びオープンされました。\n作成者: {creator.mention if creator else '不明'}",
            color=discord.Color.green()
        )

        await interaction.followup.send(embed=embed)

async def setup(bot):
    await bot.add_cog(TicketCog(bot))