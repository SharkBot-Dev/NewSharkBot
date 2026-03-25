import discord
from discord import app_commands
from typing import Any, Dict

class Command:
    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description
        self.parameters: Dict[str, Any] = {}

    async def execute(self, interaction: discord.Interaction, **kwargs):
        return

    def get_name(self):
        return self.name

    def get_description(self):
        return self.description