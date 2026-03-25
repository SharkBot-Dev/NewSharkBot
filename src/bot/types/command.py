import discord

class Command:
    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description
    
    async def execute(self, interaction: discord.Integration):
        return
    
    def get_name(self):
        return self.name
    
    def get_description(self):
        return self.description