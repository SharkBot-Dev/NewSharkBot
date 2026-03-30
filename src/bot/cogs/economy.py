import logging

from discord.ext import commands
import discord
import asyncio
import random

from lib.command import Command
from main import NewSharkBot

import discord
import random

class BlackjackView(discord.ui.View):
    def __init__(self, interaction, bet, bot_api, guild_id, user_id):
        super().__init__(timeout=60)
        self.interaction = interaction
        self.bet = bet
        self.api = bot_api
        self.guild_id = guild_id
        self.user_id = int(user_id)
        
        self.deck = [2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10, 11] * 4
        random.shuffle(self.deck)
        
        self.player_hand = [self.draw(), self.draw()]
        self.dealer_hand = [self.draw(), self.draw()]

        self.is_finish = False
        self._action_lock = asyncio.Lock()
        
    def draw(self):
        return self.deck.pop()

    def get_score(self, hand):
        score = sum(hand)
        aces = hand.count(11)
        while score > 21 and aces > 0:
            score -= 10
            aces -= 1
        return score

    def create_embed(self, show_dealer=False):
        p_score = self.get_score(self.player_hand)
        d_score = self.get_score(self.dealer_hand)
        
        embed = discord.Embed(title="🃏 ブラックジャック", color=discord.Color.blue())
        
        p_cards = ", ".join(map(str, self.player_hand)).replace("11", "A")
        embed.add_field(name="👤 あなたの手札", value=f"カード: `[{p_cards}]` \nスコア: **{p_score}**", inline=False)
        
        if show_dealer:
            d_cards = ", ".join(map(str, self.dealer_hand)).replace("11", "A")
            embed.add_field(name="🏢 ディーラーの手札", value=f"カード: `[{d_cards}]` \nスコア: **{d_score}**", inline=False)
        else:
            d_first_card = str(self.dealer_hand[0]).replace("11", "A")
            embed.add_field(name="🏢 ディーラーの手札", value=f"カード: `[{d_first_card}, ?]` \nスコア: **?**", inline=False)
        
        return embed

    async def check_user(self, interaction: discord.Interaction):
        if interaction.user.id != self.user_id:
            await interaction.response.send_message("このゲームはあなたの操作対象ではありません。", ephemeral=True)
            return False
        return True

    @discord.ui.button(label="ヒット (引く)", style=discord.ButtonStyle.green)
    async def hit(self, interaction: discord.Interaction, button: discord.ui.Button):
        if not await self.check_user(interaction):
            return
        async with self._action_lock:
            if self.is_finish:
                return
            self.player_hand.append(self.draw())
            score = self.get_score(self.player_hand)
            if score > 21:
                self.is_finish = True
                await self.end_game(interaction, "バースト！あなたの負けです。", -self.bet)
            else:
                await interaction.response.edit_message(embed=self.create_embed())

    @discord.ui.button(label="スタンド (勝負)", style=discord.ButtonStyle.red)
    async def stand(self, interaction: discord.Interaction, button: discord.ui.Button):
        if not await self.check_user(interaction): return
        
        if self.is_finish: return 
        
        self.is_finish = True 
        
        if not await self.check_user(interaction):
            return
        async with self._action_lock:
            if self.is_finish:
                return
            self.is_finish = True

        while self.get_score(self.dealer_hand) < 17:
            self.dealer_hand.append(self.draw())
            
        p_score = self.get_score(self.player_hand)
        d_score = self.get_score(self.dealer_hand)
        
        if d_score > 21:
            await self.end_game(interaction, "ディーラーがバースト！あなたの勝ちです。", self.bet)
        elif p_score > d_score:
            await self.end_game(interaction, "あなたの勝ちです！", self.bet)
        elif p_score < d_score:
            await self.end_game(interaction, "ディーラーの勝ちです。", -self.bet)
        else:
            await self.end_game(interaction, "引き分け（プッシュ）です。", 0)

    async def end_game(self, interaction, result_text, money_change):
        self.stop()
        
        current_data = await self.api.get_economy_user(self.guild_id, self.user_id)
        latest_money = current_data.get('money', 0)
        new_money = latest_money + money_change
        await self.api.save_user_setting(self.guild_id, self.user_id, money=new_money)
        
        embed = self.create_embed(show_dealer=True)
        embed.description = f"### 結果: {result_text}\nコイン変動: `{money_change:+,}` | 現在の所持金: `{new_money:,}`"
        embed.color = discord.Color.gold() if money_change > 0 else (discord.Color.red() if money_change < 0 else discord.Color.light_grey())
        
        if interaction.response.is_done():
            await interaction.edit_original_response(embed=embed, view=None)
        else:
            await interaction.response.edit_message(embed=embed, view=None)

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
            ("leaderboard", "コイン所持量のランキングを表示します。", self.leaderboard_command),
            ("add-money", "メンバーにお金を追加します。", self.add_money_command),
            ("remove-money", "メンバーからお金を奪います。", self.remove_money_command),
            ("spawn-item", "アイテムをメンバーのインベントリに追加します。", self.spawn_item_command),
            ("guess", "1から100までの数字を推測してコインを獲得できます。", self.guess_command),
            ("dice", "コインを賭けてダイスを振ります。", self.dice_command),
            ("bj", "ブラックジャックでコインを賭けて遊びます。", self.blackjack_command)
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
            if not item.get("can_buy"):
                continue

            item_type = item.get('type', 'item')
            desc = f"価格: `{item['price']}` コイン\nタイプ: `{item_type}`"
            
            if not item.get("can_buy_multiple") and not item.get("auto_use"):
                desc += "\n⚠️ *1つのみ所持可能です*"

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
                return await interaction.followup.send("そのアイテムは見つかりませんでした。")

            if not target_item.get("can_buy"):
                return await interaction.followup.send("このアイテムは現在購入できません。")

            user_data = await self.bot.api.get_economy_user(guild_id, user_id)
            current_money = user_data.get("money", 0)
            current_inventory = user_data.get("inventory", [])

            is_auto_use = target_item.get("auto_use", False)
            target_id = target_item["id"]

            if not is_auto_use and not target_item.get("can_buy_multiple"):
                already_has = any(inv["item_id"] == target_id for inv in current_inventory)
                if already_has:
                    return await interaction.followup.send("このアイテムは既に所持しています。")
                if amount > 1:
                    return await interaction.followup.send("このアイテムは複数購入できません。")

            total_price = target_item["price"] * amount
            if current_money < total_price:
                return await interaction.followup.send(
                    f"所持金が足りません。\n必要: **{total_price}** / 所持: **{current_money}**"
                )

            new_items_payload = []
            if not is_auto_use:
                item_found = False
                for inv in current_inventory:
                    iq = inv["quantity"]
                    if inv["item_id"] == target_id:
                        iq += amount
                        item_found = True
                    new_items_payload.append({"item_id": inv["item_id"], "quantity": iq})
                
                if not item_found:
                    new_items_payload.append({"item_id": target_id, "quantity": amount})
            else:
                new_items_payload = None

            new_money = current_money - total_price
            await self.bot.api.save_user_setting(
                guild_id=guild_id,
                user_id=user_id,
                money=new_money,
                items=new_items_payload
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
                                success_msg += f"\nロール付与権限が足りませんでした（管理者のロール順位を確認してください）。"

            await interaction.followup.send(success_msg)

        except Exception as e:
            print(f"Error in buy_command: {e}")
            await interaction.followup.send("購入処理中にエラーが発生しました。")

    async def inventory_command(self, interaction: discord.Interaction):
        await interaction.response.defer()
        guild_id = str(interaction.guild_id)
        user_id = str(interaction.user.id)

        user_data = await self.bot.api.get_economy_user(guild_id, user_id)

        inventory = user_data.get("inventory", [])

        if not inventory:
            return await interaction.followup.send("インベントリは空です。")

        embed = discord.Embed(
            title=f"👜 {interaction.user.display_name}さんのインベントリ",
            color=discord.Color.blue()
        )

        item_list_text = ""
        for inv in inventory:
            item_name = inv["item"]["name"]
            count = inv["quantity"]
            item_list_text += f"**{item_name}** × {count}\n"
        
        embed.description = item_list_text
        await interaction.followup.send(embed=embed)

    async def use_command(self, interaction: discord.Interaction, **kwargs):
        item_input = kwargs.get("item", None)
        if not item_input:
            return await interaction.response.send_message("アイテム名を指定してください。", ephemeral=True)
        
        await interaction.response.defer()
        guild_id = str(interaction.guild_id)
        user_id = str(interaction.user.id)

        try:
            user_data = await self.bot.api.get_economy_user(guild_id, user_id)
            inventory = user_data.get("inventory", [])

            target_inv_entry = next(
                (inv for inv in inventory if inv.get("item") and inv["item"]["name"].lower().strip() == item_input.lower().strip()), 
                None
            )

            if not target_inv_entry:
                return await interaction.followup.send("そのアイテムを持っていません。", ephemeral=True)

            target_item = target_inv_entry["item"]
            target_id = target_inv_entry["item_id"]
            success_msg = f"✨ **{target_item['name']}** を使用しました！"
            
            if target_item.get("type") == "role":
                role_id = target_item.get("role_id")
                if role_id:
                    role = interaction.guild.get_role(int(role_id))
                    if role:
                        try:
                            await interaction.user.add_roles(role)
                            success_msg += f"\nロール **{role.name}** が付与されました。"
                        except discord.Forbidden:
                            success_msg += f"\n⚠️ 権限不足によりロールを付与できませんでした。"

            new_items_payload = []
            for inv in inventory:
                item_id = inv["item_id"]
                quantity = inv["quantity"]
                
                if item_id == target_id:
                    quantity -= 1
                
                if quantity > 0:
                    new_items_payload.append({"item_id": item_id, "quantity": quantity})

            await self.bot.api.save_user_setting(
                guild_id=guild_id,
                user_id=user_id,
                items=new_items_payload
            )
            
            await interaction.followup.send(success_msg)

        except Exception as e:
            print(f"Error in use_command: {e}")
            await interaction.followup.send("アイテムの使用中にエラーが発生しました。")

    async def add_money_command(self, interaction: discord.Interaction, **kwargs):
        await interaction.response.defer()
        guild_id = str(interaction.guild_id)
        user_id = str(kwargs.get('user'))
        amount = int(kwargs.get('amount'))

        if amount <= 0:
            return await interaction.followup.send("金額は1以上を指定してください。")

        current = await self.bot.api.get_economy_user(guild_id, user_id)
        current_money = current.get("money", 0) if current else 0
        new_money = current_money + amount
        
        await self.bot.api.save_user_setting(guild_id, user_id, money=new_money)

        await interaction.followup.send(f"<@{user_id}>に{amount}コイン追加しました。", allowed_mentions=discord.AllowedMentions.none())

    async def remove_money_command(self, interaction: discord.Interaction, **kwargs):
        await interaction.response.defer()
        guild_id = str(interaction.guild_id)
        user_id = str(kwargs.get('user'))
        amount = int(kwargs.get('amount'))

        if amount <= 0:
            return await interaction.followup.send("金額は1以上を指定してください。")

        current = await self.bot.api.get_economy_user(guild_id, user_id)
        current_money = current.get("money", 0) if current else 0
        new_money = max(0, current_money - amount)
        
        await self.bot.api.save_user_setting(guild_id, user_id, money=new_money)
        
        await self.bot.api.update_cooldown(guild_id, user_id, "work")

        await interaction.followup.send(f"<@{user_id}>から{amount}コイン奪いました。", allowed_mentions=discord.AllowedMentions.none())

    async def spawn_item_command(self, interaction: discord.Interaction, **kwargs):
        await interaction.response.defer()
        guild_id = str(interaction.guild_id)
        user_id = str(kwargs.get('user'))
        item_name = kwargs.get('item')
        amount = int(kwargs.get('amount', 1))

        if not item_name:
            return await interaction.followup.send("アイテム名を指定してください。")
        if amount <= 0:
            return await interaction.followup.send("個数は1以上を指定してください。")

        try:
            all_items = await self.bot.api.get_economy_items(guild_id)
            target_item = next((i for i in all_items if i["name"].lower().strip() == item_name.lower().strip()), None)

            if not target_item:
                return await interaction.followup.send(f"アイテムがストアに見つかりません。")
            
            user_data = await self.bot.api.get_economy_user(guild_id, user_id)
            current_inventory = user_data.get("inventory", [])

            new_items_payload = []
            item_found = False
            target_id = target_item["id"]

            for inv in current_inventory:
                iq = inv["quantity"]
                if inv["item_id"] == target_id:
                    iq += amount
                    item_found = True
                new_items_payload.append({"item_id": inv["item_id"], "quantity": iq})

            if not item_found:
                new_items_payload.append({"item_id": target_id, "quantity": amount})

            await self.bot.api.save_user_setting(
                guild_id=guild_id,
                user_id=user_id,
                items=new_items_payload
            )

            await interaction.followup.send(
                f"🎁 <@{user_id}> のインベントリに **{target_item['name']}** を {amount}個 追加（生成）しました。",
                allowed_mentions=discord.AllowedMentions.none()
            )

        except Exception as e:
            logging.error(f"Error in spawn_item_command: {e}")
            await interaction.followup.send("アイテムの生成中にエラーが発生しました。")

    async def guess_command(self, interaction: discord.Interaction, **kwargs):
        await interaction.response.defer()
        guild_id = str(interaction.guild_id)
        user_id = str(interaction.user.id)
        
        bet = int(kwargs.get('amount', 100))
        
        if bet <= 0:
            return await interaction.followup.send("1コイン以上を賭けてください。")

        user_data = await self.bot.api.get_economy_user(guild_id, user_id)
        current_money = user_data.get("money", 0)
        
        if current_money < bet:
            return await interaction.followup.send(f"所持金が足りません（必要: {bet}コイン）。")

        answer = random.randint(1, 100)
        max_attempts = 5
        attempts = 0
        
        await interaction.followup.send(
            f"🎲 1から100までの数字を当ててください！\n"
            f"チャンスは **{max_attempts}回** です。賭け金: `{bet}`コイン\n"
            f"チャットに数字を入力してください。"
        )

        def check(m):
            return m.author.id == interaction.user.id and m.channel.id == interaction.channel_id and m.content.isdigit()

        win = False
        while attempts < max_attempts:
            try:
                msg = await self.bot.wait_for("message", check=check, timeout=30.0)
                guess = int(msg.content)
                attempts += 1
                
                if guess == answer:
                    win = True
                    break
                elif guess < answer:
                    await interaction.followup.send(f"🔼 **もっと大きい**です！（残り {max_attempts - attempts}回）")
                else:
                    await interaction.followup.send(f"🔽 **もっと小さい**です！（残り {max_attempts - attempts}回）")

            except asyncio.TimeoutError:
                return await interaction.followup.send(f"⏰ 時間切れです！正解は **{answer}** でした。")

        current_data = await self.bot.api.get_user_setting(guild_id, user_id)
        latest_money = current_data.get('money', 0)

        if win:
            reward = bet * 2
            new_money = latest_money + reward
            await self.bot.api.save_user_setting(guild_id, user_id, money=new_money)
            await interaction.followup.send(
                f"🎉 **正解！！** {attempts}回目で当てました！\n"
                f"報酬として **{reward}** コインを獲得しました！"
            )
        else:
            new_money = latest_money - bet
            await self.bot.api.save_user_setting(guild_id, user_id, money=new_money)
            await interaction.followup.send(
                f"💀 残念... チャンスを使い果たしました。\n"
                f"正解は **{answer}** でした。 **{bet}** コインを失いました。"
            )

    async def leaderboard_command(self, interaction: discord.Interaction, **kwargs):
        await interaction.response.defer()
        guild_id = str(interaction.guild_id)

        all_users = await self.bot.api.get_economy_leaderboard(guild_id)
        
        if not all_users:
            return await interaction.followup.send("ランキングデータがありません。")

        top_users = sorted(all_users, key=lambda x: x.get("money", 0), reverse=True)[:10]

        embed = discord.Embed(
            title=f"🏆 {interaction.guild.name} 経済ランキング",
            color=discord.Color.gold(),
            timestamp=discord.utils.utcnow()
        )

        description = ""
        for i, user_data in enumerate(top_users, 1):
            user_id = user_data.get("user_id")
            money = user_data.get("money", 0)
            member = interaction.guild.get_member(int(user_id))
            name = member.display_name if member else f"Unknown({user_id})"
            
            medal = "🥇" if i == 1 else "🥈" if i == 2 else "🥉" if i == 3 else f"`{i}.`"
            description += f"{medal} **{name}**: {money:,} コイン\n"

        embed.description = description
        await interaction.followup.send(embed=embed)

    async def dice_command(self, interaction: discord.Interaction, **kwargs):
        await interaction.response.defer()
        guild_id = str(interaction.guild_id)
        user_id = str(interaction.user.id)

        bet_str = kwargs.get('amount')
        if not bet_str:
            return await interaction.followup.send("賭ける金額を指定してください。")
        
        bet = int(bet_str)
        if bet <= 0:
            return await interaction.followup.send("1コイン以上を賭けてください。")

        user_data = await self.bot.api.get_economy_user(guild_id, user_id)
        current_money = user_data.get("money", 0)

        if current_money < bet:
            return await interaction.followup.send(f"所持金が足りません（所持: {current_money}コイン）。")

        user_roll = random.randint(1, 6)
        bot_roll = random.randint(1, 6)

        result_msg = f"🎲 あなたの出目: **{user_roll}**\n🎲 相手の出目: **{bot_roll}**\n\n"

        if user_roll > bot_roll:
            reward = bet 
            new_money = current_money + reward
            result_msg += f"🎊 おめでとうございます！勝利しました！\n**+{reward}** コイン獲得！"
            color = discord.Color.green()
        elif user_roll < bot_roll:
            new_money = current_money - bet
            result_msg += f"💀 残念... 負けました。\n**-{bet}** コイン没収。"
            color = discord.Color.red()
        else:
            new_money = current_money
            result_msg += "⚖️ 引き分けです。コインは戻されました。"
            color = discord.Color.light_grey()

        await self.bot.api.save_user_setting(guild_id, user_id, money=new_money)

        embed = discord.Embed(title="🎲 ダイス・バトル", description=result_msg, color=color)
        await interaction.followup.send(embed=embed)

    async def blackjack_command(self, interaction: discord.Interaction, **kwargs):
        await interaction.response.defer()
        guild_id = str(interaction.guild_id)
        user_id = str(interaction.user.id)
        
        bet = int(kwargs.get('amount', 100))
        if bet <= 0:
            return await interaction.followup.send("1コイン以上を賭けてください。")

        user_data = await self.bot.api.get_economy_user(guild_id, user_id)
        current_money = user_data.get("money", 0)

        if current_money < bet:
            return await interaction.followup.send(f"所持金が足りません（所持: {current_money}コイン）。")

        view = BlackjackView(interaction, bet, self.bot.api, guild_id, user_id)
        embed = view.create_embed()
        await interaction.followup.send(embed=embed, view=view)

async def setup(bot):
    await bot.add_cog(EconomyCog(bot))