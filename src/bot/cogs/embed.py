import discord
from discord import ui
from discord.ext import commands

from lib import command


import discord
from discord import ui
from datetime import datetime

class TextEditModal(ui.Modal):
    def __init__(self, current_embed: discord.Embed, view: ui.View):
        super().__init__(title="テキスト設定")
        self.view = view
        self.etitle = ui.TextInput(label="タイトル", default=current_embed.title, required=False, max_length=256)
        self.description = ui.TextInput(label="説明文", style=discord.TextStyle.paragraph, default=current_embed.description, required=False, max_length=4000)
        self.add_item(self.etitle)
        self.add_item(self.description)

    async def on_submit(self, interaction: discord.Interaction):
        self.view.embed.title = self.etitle.value or None
        self.view.embed.description = self.description.value or None
        await self.view.update_message(interaction)

class ImageEditModal(ui.Modal):
    def __init__(self, current_embed: discord.Embed, view: ui.View):
        super().__init__(title="画像設定")
        self.view = view
        self.image_url = ui.TextInput(label="メイン画像URL", default=current_embed.image.url if current_embed.image else "", required=False)
        self.thumb_url = ui.TextInput(label="サムネイルURL", default=current_embed.thumbnail.url if current_embed.thumbnail else "", required=False)
        self.add_item(self.image_url)
        self.add_item(self.thumb_url)

    async def on_submit(self, interaction: discord.Interaction):
        self.view.embed.set_image(url=self.image_url.value or None)
        self.view.embed.set_thumbnail(url=self.thumb_url.value or None)
        await self.view.update_message(interaction)

class IdentityEditModal(ui.Modal):
    def __init__(self, current_embed: discord.Embed, view: ui.View):
        super().__init__(title="著者・フッター・色設定")
        self.view = view
        self.author_name = ui.TextInput(label="作成者名", default=current_embed.author.name if current_embed.author else "", required=False)
        self.footer_text = ui.TextInput(label="フッター文字", default=current_embed.footer.text if current_embed.footer else "", required=False)
        self.color_hex = ui.TextInput(label="色 (16進数 例: #ffffff)", default=f"#{current_embed.color.value:06x}" if current_embed.color else "#2b2d31", required=False)
        
        self.add_item(self.author_name)
        self.add_item(self.footer_text)
        self.add_item(self.color_hex)

    async def on_submit(self, interaction: discord.Interaction):
        # 著者
        if self.author_name.value:
            self.view.embed.set_author(name=self.author_name.value)
        else:
            self.view.embed.remove_author()
        
        # フッター
        if self.footer_text.value:
            self.view.embed.set_footer(text=self.footer_text.value)
        else:
            self.view.embed.set_footer(text=None)

        # 色
        try:
            hex_val = self.color_hex.value.lstrip('#')
            self.view.embed.color = discord.Color(int(hex_val, 16))
        except:
            pass

        await self.view.update_message(interaction)

class EmbedMakerView(ui.View):
    def __init__(self, author: discord.Member, api):
        super().__init__(timeout=600)
        self.author = author
        self.embed = discord.Embed(title="新規埋め込み", description="各ボタンから詳細を設定してください。", color=discord.Color.blue())
        self.has_timestamp = False
        self.api = api

    async def update_message(self, interaction: discord.Interaction):
        self.embed.timestamp = datetime.now() if self.has_timestamp else None
        await interaction.response.edit_message(embed=self.embed, view=self)

    @ui.button(label="テキスト", style=discord.ButtonStyle.secondary, emoji="📝", row=0)
    async def edit_text(self, interaction: discord.Interaction, button: ui.Button):
        await interaction.response.send_modal(TextEditModal(self.embed, self))

    @ui.button(label="画像・サムネ", style=discord.ButtonStyle.secondary, emoji="🖼️", row=0)
    async def edit_image(self, interaction: discord.Interaction, button: ui.Button):
        await interaction.response.send_modal(ImageEditModal(self.embed, self))

    @ui.button(label="著者・フッター", style=discord.ButtonStyle.secondary, emoji="👤", row=1)
    async def edit_identity(self, interaction: discord.Interaction, button: ui.Button):
        await interaction.response.send_modal(IdentityEditModal(self.embed, self))

    @ui.button(label="時刻表示: OFF", style=discord.ButtonStyle.gray, emoji="⏰", row=1)
    async def toggle_timestamp(self, interaction: discord.Interaction, button: ui.Button):
        self.has_timestamp = not self.has_timestamp
        button.label = f"時刻表示: {'ON' if self.has_timestamp else 'OFF'}"
        button.style = discord.ButtonStyle.success if self.has_timestamp else discord.ButtonStyle.gray
        await self.update_message(interaction)

    @ui.button(label="送信", style=discord.ButtonStyle.danger, emoji="🚀", row=2)
    async def confirm(self, interaction: discord.Interaction, button: ui.Button):
        if interaction.user != self.author:
            return await interaction.response.send_message("権限がありません。", ephemeral=True)
        
        await interaction.response.send_message(content="✅ 送信しました。", ephemeral=True)
        await interaction.channel.send(embed=self.embed)
        
    @ui.button(label="保存", style=discord.ButtonStyle.danger, emoji="💾", row=2)
    async def save(self, interaction: discord.Interaction, button: ui.Button):
        if interaction.user != self.author:
            return await interaction.response.send_message("権限がありません。", ephemeral=True)
        
        try:
            saved = await self.api.save_embed_setting(str(interaction.guild.id), self.embed.title, self.embed.to_dict())
        except:
            await interaction.response.send_message(content="❌ 保存しました。", ephemeral=True)
            return

        await interaction.response.send_message(content="✅ 保存しました。", ephemeral=True)

class EmbedsCog(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

        cmd = command.Command(name="embed", description="埋め込みを作成＆保存します。", module_name="埋め込み作成")
        cmd.execute = self.embed_command
        self.bot.add_slashcommand(cmd)

        print("init -> EmbedsCog")

    async def embed_command(self, interaction: discord.Interaction):
        view = EmbedMakerView(interaction.user, self.bot.api)
        
        await interaction.response.send_message(
            "以下のボタンを押して操作してください。",
            embed=view.embed,
            view=view,
            ephemeral=True
        )

async def setup(bot):
    await bot.add_cog(EmbedsCog(bot))