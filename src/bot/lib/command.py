import discord
from discord import app_commands
from typing import Any, Dict


class Command:
    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description
<<<<<<< HEAD
        self.parameters: Dict[str, Any] = {}

    async def execute(self, interaction: discord.Interaction, **kwargs):
=======

    async def execute(self, interaction: discord.Integration):
>>>>>>> 293bed9c031a0858d785715f4367d794db9c56d3
        return

    def get_name(self):
        return self.name

    def get_description(self):
        return self.description
