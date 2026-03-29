import copy
import json
import logging
import random

from discord.ext import commands
import discord
import asyncio

from main import NewSharkBot


class CommandsCog(commands.Cog):
    def __init__(self, bot: NewSharkBot):
        self.bot = bot
        print("init -> CommandsCog")

    @commands.Cog.listener("on_interaction")
    async def on_interaction_commands(self, interaction: discord.Interaction):
        if interaction.type != discord.InteractionType.application_command:
            return

        commands_list = self.bot.slashcommands
        cmd_name = interaction.data.get("name", "none")
        command = commands_list.get(cmd_name, None)

        if not command:
            await interaction.response.send_message(
                ephemeral=True,
                content="そのコマンドは見つかりません。\n削除された可能性があります。",
            )
            return

        resolved_args = {}
        options = interaction.data.get("options", [])

        for option in options:
            arg_name = option.get("name")
            arg_value = option.get("value")
            resolved_args[arg_name] = arg_value

        asyncio.create_task(command.execute(interaction, **resolved_args))

    async def get_prefix(self, guildId: int):
        fetch = await self.bot.api.get_prefixs(str(guildId))
        return fetch.get("prefix") or fetch.get("prefixs") or ["!"]

    def parse_variables(self, text: str, message: discord.Message, args: list, custom_vars: dict) -> str:
        if not isinstance(text, str):
            return text
        
        text = text.replace("{ユーザー名}", str(message.author.display_name))
        text = text.replace("{ユーザーID}", str(message.author.id))
        text = text.replace("{サーバー名}", str(message.guild.name))
        
        for i, arg in enumerate(args):
            text = text.replace(f"{{引数[{i}]}}", str(arg))
            
        for k, v in custom_vars.items():
            text = text.replace(f"{{変数.{k}}}", str(v))
            
        return text

    async def _get_processed_embed(self, guild_id: str, embed_id: int, message: discord.Message, args: list, custom_vars: dict):
        raw_embed = await self.bot.embed.getEmbed(guild_id, embed_id)
        if not raw_embed:
            return None

        embed_data = copy.deepcopy(raw_embed)
        
        def process_dict(d):
            for k, v in d.items():
                if isinstance(v, str):
                    d[k] = self.parse_variables(v, message, args, custom_vars)
                elif isinstance(v, dict):
                    process_dict(v)
                elif isinstance(v, list):
                    for i in range(len(v)):
                        if isinstance(v[i], dict):
                            process_dict(v[i])

        process_dict(embed_data)
        return discord.Embed.from_dict(embed_data)

    async def execute_actions(self, message: discord.Message, cmd_data: dict, args: list):
        if cmd_data.get('allowed_channels') and str(message.channel.id) not in cmd_data['allowed_channels']:
            return 

        if cmd_data.get('allowed_roles'):
            user_role_ids = [str(r.id) for r in message.author.roles]
            if not any(rid in user_role_ids for rid in cmd_data['allowed_roles']):
                return

        actions = sorted(cmd_data['actions'], key=lambda x: x.get('order', 0))
        custom_vars = {}
        is_send_dm = False

        for action in actions:
            action_type = action['type']
            try:
                payload = json.loads(action['payload']) if isinstance(action['payload'], str) else action['payload']
            except json.JSONDecodeError:
                continue

            content = self.parse_variables(payload.get('content', ''), message, args, custom_vars)
            if payload.get('messages') and payload.get('is_random'):
                content = self.parse_variables(random.choice(payload['messages']), message, args, custom_vars)

            embed = None
            if payload.get('embed_id'):
                embed = await self._get_processed_embed(str(message.guild.id), int(payload.get('embed_id')), message, args, custom_vars)

            try:
                if action_type == "reply":
                    await message.reply(content=content or None, embed=embed)

                elif action_type == "send":
                    await message.channel.send(content=content or None, embed=embed)

                elif action_type in ("role", "role_op"):
                    role_id = int(payload.get('role_id'))
                    role = message.guild.get_role(role_id)
                    if role:
                        op = payload.get('type') or payload.get('op')
                        if op == "add":
                            await message.author.add_roles(role)
                        else:
                            await message.author.remove_roles(role)

                elif action_type in ("var_set", "variable"):
                    key = payload.get('key')
                    val = payload.get('value')
                    custom_vars[key] = self.parse_variables(str(val), message, args, custom_vars)

                await asyncio.sleep(0.5)

            except (discord.Forbidden, discord.HTTPException) as e:
                print(f"Action {action_type} failed: {e}")
                continue

    @commands.Cog.listener()
    async def on_message(self, message: discord.Message):
        if message.author.bot or not message.guild:
            return

        is_enabled = await self.bot.api.is_module_enabled(str(message.guild.id), "commands")
        if not is_enabled or not is_enabled.get('enabled'):
            return

        prefixes = await self.get_prefix(message.guild.id)

        used_prefix = None

        for p in sorted(prefixes, key=len, reverse=True):
            if message.content.startswith(p):
                used_prefix = p
                break
                
        if used_prefix:
            content_without_prefix = message.content[len(used_prefix):].strip()
            if not content_without_prefix:
                return

            parts = content_without_prefix.split()
            cmd_name = parts[0]
            args = parts[1:]

            logging.error(f"DEBUG: 判定されたプレフィックス: '{used_prefix}'")
            logging.error(f"DEBUG: 検索するコマンド名: '{cmd_name}'")

            data = await self.bot.api.get_command(message.guild.id, cmd_name)
            if data:
                await self.execute_actions(message, data, args)

        else:
            auto_commands = await self.bot.api.get_auto_commands(message.guild.id)
            for cmd in auto_commands:
                trigger_name = cmd['name']
                match_mode = cmd.get('match_mode', 'contains')
                
                if match_mode == "exact":
                    should_execute = message.content.strip() == trigger_name
                else:
                    should_execute = trigger_name in message.content

                if should_execute:
                    asyncio.create_task(self.execute_actions(message, cmd, []))
                    break

async def setup(bot):
    await bot.add_cog(CommandsCog(bot))
