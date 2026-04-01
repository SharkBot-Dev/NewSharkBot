import logging

from discord.ext import commands
import discord
import secrets
from main import NewSharkBot

class AuthCog(commands.Cog):
    def __init__(self, bot: NewSharkBot):
        self.bot = bot
        self.web_url = "https://www.sharkbot.xyz" 
        print("init -> AuthCog")

    @commands.Cog.listener("on_interaction")
    async def on_interaction_auth(self, interaction: discord.Interaction):
        if interaction.type != discord.InteractionType.component:
            return
        
        custom_id = interaction.data.get('custom_id', "")
        if not interaction.guild:
            return
        
        if custom_id.startswith("auth:click:"):
            await interaction.response.defer(ephemeral=True, thinking=True)
            await self._handle_click_auth(interaction, custom_id)

        elif custom_id.startswith("auth:web:"):
            await interaction.response.defer(ephemeral=True, thinking=True)
            
            role_id_str = custom_id.split(":")[2] 
            guild_id = str(interaction.guild.id)
            user_id = str(interaction.user.id)
            
            role = interaction.guild.get_role(int(role_id_str))
            if role and role in interaction.user.roles:
                await interaction.followup.send("すでに認証済みです。", ephemeral=True)
                return

            auth_code = secrets.token_urlsafe(32)

            try:
                await self.bot.api.create_auth_code(
                    guild_id=guild_id,
                    user_id=user_id,
                    role_id=role_id_str,
                    code=auth_code
                )

                target_url = f"{self.web_url}/auth/{guild_id}?code={auth_code}"
                
                embed = discord.Embed(
                    title="Web認証が必要です",
                    description="下のボタンをクリックして、ブラウザで認証を完了させてください。",
                    color=discord.Color.blue()
                )
                
                view = discord.ui.View()
                view.add_item(discord.ui.Button(label="認証ページを開く", url=target_url))

                await interaction.followup.send(embed=embed, view=view, ephemeral=True)

            except Exception as e:
                logging.error(f"WebAuth Error: {e}")
                await interaction.followup.send("認証URLの生成に失敗しました。後ほどやり直してください。", ephemeral=True)

    async def _handle_click_auth(self, interaction, custom_id):
        role_id = int(custom_id.split(":")[2])
        role = interaction.guild.get_role(role_id)
        if not role:
            await interaction.followup.send("ロールが見つかりません。", ephemeral=True)
            return
        
        try:
            if role in interaction.user.roles:
                await interaction.followup.send("すでに認証しています。", ephemeral=True)
            else:
                await interaction.user.add_roles(role)
                await interaction.followup.send("認証しました。", ephemeral=True)
        except discord.Forbidden:
            await interaction.followup.send("ボットに権限がありません。", ephemeral=True)

async def setup(bot):
    await bot.add_cog(AuthCog(bot))
