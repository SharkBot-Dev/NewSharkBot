import logging

from discord.ext import commands
import discord
import asyncio
import random

from lib.command import Command
from main import NewSharkBot

class EconomyCog(commands.Cog):
    def __init__(self, bot: NewSharkBot):
        self.bot = bot
        
        self._register_commands()
        print("init -> EconomyCog")

    def _register_commands(self):
        commands_to_add = [
            ("daily", "毎日一回のコインを得ます。", self.daily_command),
            ("work", "働いてコインを得ます。", self.work_command),
            ("balance", "コインを確認します。", self.balance_command),
            ("shop", "ショップを確認します。", self.shop_command),
            ("buy", "アイテムを購入します。", self.buy_command),
            ("inventory", "所持アイテムを確認します。", self.inventory_command),
            ("use", "所持アイテムを使用します。", self.use_command),
        ]

        for name, desc, func in commands_to_add:
            cmd = Command(name=name, description=desc, module_name="経済")
            cmd.execute = func
            self.bot.add_slashcommand(cmd)

    async def daily_command(self, interaction: discord.Interaction, **kwargs):
        await interaction.response.defer()
        guild_id = str(interaction.guild_id)
        user_id = str(interaction.user.id)

        cd = await self.bot.api.get_cooldown(guild_id, user_id)
        if not cd["daily"]["can_ready"]:
            return await interaction.followup.send(
                f"今日の報酬はすでに受け取っています。あと {int(cd['daily']['remaining'] / 60)} 分後に再度試してください。"
            )
        
        coin = random.randint(500, 1000)

        current = await self.bot.api.get_economy_user(guild_id, user_id)
        current_money = current.get("money", 0) if current else 0
        new_money = current_money + coin

        await self.bot.api.save_user_setting(guild_id, user_id, money=new_money)
        
        await self.bot.api.update_cooldown(guild_id, user_id, "daily")
        
        await interaction.followup.send(f"💸 毎日報酬として {coin}コイン を獲得しました！")

    async def work_command(self, interaction: discord.Interaction, **kwargs):
        await interaction.response.defer()
        guild_id = str(interaction.guild_id)
        user_id = str(interaction.user.id)

        cd = await self.bot.api.get_cooldown(guild_id, user_id)
        if not cd["work"]["can_ready"]:
            return await interaction.followup.send(f"まだ休憩中です。あと {int(cd['work']['remaining'])} 秒待ってください。")

        reward = random.randint(300, 1000)

        current = await self.bot.api.get_economy_user(guild_id, user_id)
        current_money = current.get("money", 0) if current else 0
        new_money = current_money + reward
        
        await self.bot.api.save_user_setting(guild_id, user_id, money=new_money)
        
        await self.bot.api.update_cooldown(guild_id, user_id, "work")

        await interaction.followup.send(f"⛏️ 働いて、{reward}コイン 稼ぎました！")

    async def balance_command(self, interaction: discord.Interaction, **kwargs):
        user = kwargs.get("user", None)
        if not user:
            user = interaction.user
        else:
            user = interaction.guild.get_member(user)

        await interaction.response.defer()
        target = user or interaction.user
        
        data = await self.bot.api.get_economy_user(str(interaction.guild_id), str(target.id))
        
        money = data.get("money", 0) if data else 0
        
        embed = discord.Embed(
            title=f"💰 {target.display_name}さんの残高", 
            description=f"{money} コイン", 
            color=discord.Color.gold()
        )
        await interaction.followup.send(embed=embed)

    async def shop_command(self, interaction: discord.Interaction, **kwargs):
        await interaction.response.defer()

        items = await self.bot.api.get_economy_items(str(interaction.guild_id))
        
        if not items:
            return await interaction.followup.send("現在、ショップにアイテムはありません。")

        embed = discord.Embed(title="🛒 サーバーショップ", color=discord.Color.gold())
        for item in items:
            item_type = item.get('type', 'item')
            desc = f"価格: `{item['price']}` コイン\nタイプ: `{item_type}`"
            
            if item_type == "role" and item.get('role_id'):
                desc += "\n✨ *購入時にロールが付与されます*"

            embed.add_field(name=f"📦 {item['name']}", value=desc, inline=True)
        
        await interaction.followup.send(embed=embed)

    async def buy_command(self, interaction: discord.Interaction, **kwargs):
        item_name = kwargs.get('item', None)
        amount = kwargs.get('amount', 1)

        if not item_name:
            return await interaction.response.send_message("アイテム名を指定してください。", ephemeral=True)
        if amount <= 0:
            return await interaction.response.send_message("個数は1以上を指定してください。", ephemeral=True)
            
        await interaction.response.defer()
        guild_id = str(interaction.guild_id)
        user_id = str(interaction.user.id)

        try:
            all_items = await self.bot.api.get_economy_items(guild_id)
            target_item = next((i for i in all_items if i["name"].lower().strip() == item_name.lower().strip()), None)

            if not target_item:
                return await interaction.followup.send(f"そのアイテムは見つかりませんでした。")

            if not target_item.get("can_buy"):
                return await interaction.followup.send("このアイテムは現在購入できません。")

            user_data = await self.bot.api.get_economy_user(guild_id, user_id)
            current_money = user_data.get("money", 0)
            current_inventory = user_data.get("items", [])

            is_auto_use = target_item.get("auto_use")

            if not is_auto_use and not target_item.get("can_buy_multiple"):
                already_has = any(i["id"] == target_item["id"] for i in current_inventory)
                if already_has:
                    return await interaction.followup.send("このアイテムは既に所持しています。")
                if amount > 1:
                    return await interaction.followup.send("このアイテムは複数購入できません。")

            total_price = target_item["price"] * amount
            if current_money < total_price:
                return await interaction.followup.send(
                    f"所持金が足りません。\n必要: **{total_price}** / 所持: **{current_money}**"
                )

            new_item_ids = [i["id"] for i in current_inventory]
            
            if not is_auto_use:
                for _ in range(amount):
                    new_item_ids.append(target_item["id"])

            new_money = current_money - total_price
            
            await self.bot.api.save_user_setting(
                guild_id=guild_id,
                user_id=user_id,
                money=new_money,
                item_ids=new_item_ids
            )

            success_msg = f"🛍️ **{target_item['name']}** を {amount}個 購入しました！"
            
            if is_auto_use:
                success_msg += f"\nこのアイテムは購入と同時に使用されました。"
                
                if target_item.get("type") == "role":
                    role_id = target_item.get("role_id")
                    if role_id:
                        role = interaction.guild.get_role(int(role_id))
                        if role:
                            try:
                                await interaction.user.add_roles(role)
                                success_msg += f"\nロール {role.name} が付与されました。"
                            except discord.Forbidden:
                                success_msg += f"\nロール付与権限が足りませんでした（管理者にお問い合わせください）。"

            await interaction.followup.send(success_msg)

        except Exception as e:
            print(f"Error in buy_command: {e}")
            await interaction.followup.send("購入処理中にエラーが発生しました。")

    async def inventory_command(self, interaction: discord.Interaction):
        await interaction.response.defer()
        guild_id = str(interaction.guild_id)
        user_id = str(interaction.user.id)

        user_data = await self.bot.api.get_economy_user(guild_id, user_id)
        items = user_data.get("items", [])

        if not items:
            return await interaction.followup.send("インベントリは空です。")

        inventory_counts = {}
        for item in items:
            name = item["name"]
            inventory_counts[name] = inventory_counts.get(name, 0) + 1

        embed = discord.Embed(
            title=f"🎒 {interaction.user.display_name}さんのインベントリ",
            color=discord.Color.blue()
        )

        item_list_text = ""
        for name, count in inventory_counts.items():
            item_list_text += f"**{name}** × {count}\n"
        
        embed.description = item_list_text
        await interaction.followup.send(embed=embed)

    async def use_command(self, interaction: discord.Interaction, **kwargs):
        item = kwargs.get("item", None)
        if not item:
            return await interaction.response.send_message("アイテム名を指定してください。", ephemeral=True)
        
        item_name = item
        
        await interaction.response.defer()
        guild_id = str(interaction.guild_id)
        user_id = str(interaction.user.id)

        user_data = await self.bot.api.get_economy_user(guild_id, user_id)
        current_items = user_data.get("items", [])

        target_index = next((index for index, i in enumerate(current_items) if i["name"].lower().strip() == item_name.lower().strip()), None)

        if target_index is None:
            return await interaction.followup.send(f"そのアイテムを持っていません。", ephemeral=True)

        target_item = current_items[target_index]

        success_msg = f"✨ **{item_name}** を使用しました！"
        
        if target_item.get("type") == "role":
            role_id = target_item.get("role_id")
            if role_id:
                role = interaction.guild.get_role(int(role_id))
                if role:
                    try:
                        await interaction.user.add_roles(role)
                        success_msg += f"\nロール {role.name} が付与されました。"
                    except discord.Forbidden:
                        success_msg += f"\n権限不足によりロールを付与できませんでした。"

        new_item_ids = [i["id"] for i in current_items]
        new_item_ids.pop(target_index) 

        try:
            await self.bot.api.save_user_setting(
                guild_id=guild_id,
                user_id=user_id,
                item_ids=new_item_ids
            )
            await interaction.followup.send(success_msg)
        except Exception as e:
            print(f"Error using item: {e}")
            await interaction.followup.send("アイテムの使用処理に失敗しました。")

async def setup(bot):
    await bot.add_cog(EconomyCog(bot))