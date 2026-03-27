import discord
from typing import Any, Dict


class Command:
    def __init__(self, name: str, description: str, module_name: str = "その他"):
        self.name = name
        self.description = description
        self.module_name = module_name
        self.parameters: Dict[str, Any] = {}

    async def execute(self, interaction: discord.Interaction, **kwargs):
        return

    def get_name(self):
        return self.name

    def get_description(self):
        return self.description

    def get_module_name(self):
        return self.module_name