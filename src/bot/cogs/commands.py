import random

import aiohttp
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

    async def get_prefix(self, guildId: str):
        fetch = await self.bot.api.get_prefixs(guildId)
        
        return fetch["prefix"]

    async def execute_actions(self, message: discord.Message, cmd_data, args):
        if cmd_data.get('allowed_channels') and str(message.channel.id) not in cmd_data['allowed_channels']:
            return 

        if cmd_data.get('allowed_roles'):
            user_role_ids = [str(r.id) for r in message.author.roles]
            if not any(rid in user_role_ids for rid in cmd_data['allowed_roles']):
                return

        actions = sorted(cmd_data['actions'], key=lambda x: x.get('order', 0))
        for action in actions:
            pass
        custom_vars = {}

        is_send_dm = False

        for action in actions:
            action_type = action['type']
            import json
            payload = json.loads(action['payload'])

            content = self.parse_variables(payload.get('content', ''), message, args, custom_vars)

            if action_type == "reply":
                if payload.get('random_messages'):
                    content = random.choice(payload['random_messages'])
                
                await message.reply(content)

            elif action_type == "send":
                if payload.get('random_messages'):
                    content = random.choice(payload['random_messages'])
                
                await message.channel.send(content)

            elif action_type in ("role", "role_op"):
                role_id = int(payload.get('role_id'))
                role = message.guild.get_role(role_id)
                if role:
                    try:
                        if payload.get('type') == "add" or payload.get('op') == "add":
                            await message.author.add_roles(role)
                        else:
                            await message.author.remove_roles(role)
                    except discord.Forbidden:
                        pass
                    except discord.HTTPException as e:
                        print(f"Failed to modify role: {e}")
                        continue

            elif action_type == "dm":
                try:
                    if is_send_dm:
                        continue
                    is_send_dm = True
                    await message.author.send(content)
                except discord.Forbidden:
                    pass

            elif action_type in ("var_set", "variable"):
                key = payload.get('key')
                val = payload.get('value')
                custom_vars[key] = self.parse_variables(val, message, args, custom_vars)

            await asyncio.sleep(0.5)
    
    def parse_variables(self, text, message: discord.Message, args, custom_vars):
        text = text.replace("{ユーザー名}", str(message.author.display_name))
        text = text.replace("{ユーザーID}", str(message.author.id))
        
        for i, arg in enumerate(args):
            text = text.replace(f"{{引数[{i}]}}", arg)
            
        for k, v in custom_vars.items():
            text = text.replace(f"{{変数.{k}}}", v)
            
        return text
    
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

            data = await self.bot.api.get_command(message.guild.id, cmd_name)
            if data:
                await self.execute_actions(message, data, args)

        else:
            auto_commands = await self.bot.api.get_auto_commands(message.guild.id)
            
            for cmd in auto_commands:
                trigger_name = cmd['name']
                match_mode = cmd.get('match_mode', 'contains')
                should_execute = False

                if match_mode == "exact":
                    if message.content.strip() == trigger_name:
                        should_execute = True
                else:
                    if trigger_name in message.content:
                        should_execute = True

                if should_execute:
                    await asyncio.create_task(self.execute_actions(message, cmd, []))
                    break

async def setup(bot):
    await bot.add_cog(CommandsCog(bot))
