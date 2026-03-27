from discord.ext import commands
import discord
import asyncio

from main import NewSharkBot


class ReactionRoleCog(commands.Cog):
    def __init__(self, bot: NewSharkBot):
        self.bot = bot
        print("init -> ReactionRoleCog")

    @commands.Cog.listener("on_interaction")
    async def on_interaction_reaction_role(self, interaction: discord.Interaction):
        if interaction.type != discord.InteractionType.component:
            return
        
        custom_id = interaction.data.get('custom_id', "")
        if not custom_id.startswith("reaction_role:"):
            return
        
        if not interaction.guild:
            return

        await interaction.response.defer(ephemeral=True, thinking=True)
        
        role_id = int(custom_id.split(":")[1])
        role = interaction.guild.get_role(role_id)

        if not role:
            await interaction.followup.send("指定されたロールが見つかりませんでした。", ephemeral=True)
            return

        member = interaction.user
        try:
            if role in member.roles:
                await member.remove_roles(role)
                action_text = "を解除しました。"
            else:
                await member.add_roles(role)
                action_text = "を付与しました。"
            
            await interaction.followup.send(f"{role.mention} {action_text}", ephemeral=True)

        except discord.Forbidden:
            await interaction.followup.send(
                "ボットに権限がないため、ロールを操作できませんでした。\n（ロールの順序を確認してください）", 
                ephemeral=True
            )
        except Exception as e:
            await interaction.followup.send(f"エラーが発生しました: {e}", ephemeral=True)


async def setup(bot):
    await bot.add_cog(ReactionRoleCog(bot))
