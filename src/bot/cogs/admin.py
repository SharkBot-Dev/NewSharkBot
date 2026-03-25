from discord.ext import commands
import discord
import asyncio

from main import NewSharkBot


class AdminCog(commands.Cog):
    def __init__(self, bot: NewSharkBot):
        self.bot = bot
        print("init -> AdminCog")

    @commands.command(name="reload")
    @commands.is_owner()
    async def reload_cmd(self, ctx: commands.Context, cog_name: str):
        await self.bot.reload_extension(f"cogs.{cog_name}")
        await ctx.message.add_reaction("✅")

    @commands.command(name="load")
    @commands.is_owner()
    async def load_cmd(self, ctx: commands.Context, cog_name: str):
        await self.bot.load_extension(f"cogs.{cog_name}")
        await ctx.message.add_reaction("✅")

async def setup(bot):
    await bot.add_cog(AdminCog(bot))
