import discord

class PaginationView(discord.ui.View):
    def __init__(self, embeds: list, timeout: float = 60.0):
        super().__init__(timeout=timeout)
        self.embeds = embeds
        self.current_page = 0

    async def update_view(self, interaction: discord.Interaction):
        self.current_page = max(0, min(self.current_page, len(self.embeds) - 1))

        self.page_indicator.label = f"{self.current_page + 1} / {len(self.embeds)}"
        self.first_page.disabled = (self.current_page == 0)
        self.prev_page.disabled = (self.current_page == 0)
        self.next_page.disabled = (self.current_page == len(self.embeds) - 1)
        self.last_page.disabled = (self.current_page == len(self.embeds) - 1)

        await interaction.response.edit_message(embed=self.embeds[self.current_page], view=self)

    @discord.ui.button(label="≪", style=discord.ButtonStyle.grey)
    async def first_page(self, interaction: discord.Interaction, button: discord.ui.Button):
        self.current_page = 0
        await self.update_view(interaction)

    @discord.ui.button(label="＜", style=discord.ButtonStyle.grey)
    async def prev_page(self, interaction: discord.Interaction, button: discord.ui.Button):
        self.current_page = max(0, self.current_page - 1)
        await self.update_view(interaction)

    @discord.ui.button(label="1 / ?", style=discord.ButtonStyle.blurple, disabled=True)
    async def page_indicator(self, interaction: discord.Interaction, button: discord.ui.Button):
        pass

    @discord.ui.button(label="＞", style=discord.ButtonStyle.grey)
    async def next_page(self, interaction: discord.Interaction, button: discord.ui.Button):
        self.current_page = min(len(self.embeds) - 1, self.current_page + 1)
        await self.update_view(interaction)

    @discord.ui.button(label="≫", style=discord.ButtonStyle.grey)
    async def last_page(self, interaction: discord.Interaction, button: discord.ui.Button):
        self.current_page = len(self.embeds) - 1
        await self.update_view(interaction)