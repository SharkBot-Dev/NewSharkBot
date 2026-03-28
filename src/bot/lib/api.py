import typing

import aiohttp
import re
from typing import Optional, List, Dict, Any, Union, Literal
from dataclasses import dataclass, asdict

# --- 型定義 ---

@dataclass
class EmbedSetting:
    guild_id: str
    name: str
    data: Dict[str, Any] 
    id: Optional[int] = None
    updated_at: Optional[str] = None

@dataclass
class MessageSetting:
    guild_id: str
    type: Literal['welcome', 'goodbye']
    channel_id: str
    content: str
    embed_id: Optional[int]
    embed: Optional[EmbedSetting] = None
    updated_at: Optional[str] = None

@dataclass
class LoggingEvent:
    event_name: str
    log_channel_id: str
    webhook_url: Optional[str] = None
    ignored_channels: List[str] = None

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "LoggingEvent":
        return cls(
            event_name=data.get("event_name", ""),
            log_channel_id=data.get("log_channel_id", ""),
            webhook_url=data.get("webhook_url"),
            ignored_channels=data.get("ignored_channels") or []
        )
    
@dataclass
class GlobalChatRoomRestriction:
    target_id: str
    type: str  # "ban_user", "ban_server", "mute_user"
    reason: str
    expires_at: Optional[str]

@dataclass
class GlobalChatRoom:
    name: str
    description: str
    slowmode: int
    min_account_age: int
    is_active: bool
    restrictions: List[GlobalChatRoomRestriction]

@dataclass
class GlobalChatConfig:
    channel_id: str
    room_name: str
    guild_id: str
    webhook_url: str
    room: Optional[GlobalChatRoom]

# --- クラス実装 ---

class ResourceAPIClient:
    def __init__(self, session: aiohttp.ClientSession, base_url: str):
        self.session = session
        self.base_url = base_url.rstrip('/')

    def _is_valid_discord_id(self, discord_id: str) -> bool:
        return bool(re.match(r'^\d{17,20}$', discord_id))

    def _validate_guild_id(self, guild_id: str):
        if not guild_id:
            raise ValueError("Guild ID is required")
        if not self._is_valid_discord_id(guild_id):
            raise ValueError("Invalid Guild ID")

    async def create_guild_entry(self, guild_id: str) -> Dict[str, Any]:
        self._validate_guild_id(guild_id)
        
        payload = {
            "id": guild_id,
            "EnabledModules": {"help": True}
        }
        
        async with self.session.put(
            f"{self.base_url}/guilds/{guild_id}",
            json=payload
        ) as resp:
            if not resp.ok:
                raise Exception(f"Failed to create guild entry: {resp.status} {await resp.text()}")
            return await resp.json()

    async def fetch_guild_settings(self, guild_id: str) -> Optional[Dict[str, Any]]:
        self._validate_guild_id(guild_id)
        
        async with self.session.get(f"{self.base_url}/guilds/{guild_id}") as resp:
            if resp.status == 404:
                return await self.create_guild_entry(guild_id)
            if not resp.ok:
                raise Exception(f"Failed to fetch guild settings: {resp.status}")
            return await resp.json()

    async def is_module_enabled(self, guild_id: str, module_name: str) -> Dict[str, Any]:
        self._validate_guild_id(guild_id)
        
        params = {"module": module_name}
        async with self.session.get(
            f"{self.base_url}/guilds/{guild_id}/module",
            params=params
        ) as resp:
            if not resp.ok:
                raise Exception(f"Failed to fetch module status: {resp.status}")
            return await resp.json()

    async def set_module_status(self, guild_id: str, module_name: str) -> Dict[str, Any]:
        self._validate_guild_id(guild_id)
        
        params = {"module": module_name}
        async with self.session.patch(
            f"{self.base_url}/guilds/{guild_id}/module",
            params=params
        ) as resp:
            if not resp.ok:
                raise Exception(f"Failed to update module status: {resp.status}")
            return await resp.json()

    # --- Message Settings ---

    async def fetch_message_setting(self, guild_id: str, setting_type: Literal['welcome', 'goodbye']) -> Optional[Dict[str, Any]]:
        self._validate_guild_id(guild_id)
        
        async with self.session.get(f"{self.base_url}/guilds/message/{guild_id}/{setting_type}") as resp:
            if resp.status == 404:
                return None
            if not resp.ok:
                raise Exception(f"Failed to fetch {setting_type} settings")
            return await resp.json()

    async def save_message_setting(self, guild_id: str, setting_type: Literal['welcome', 'goodbye'], data: Dict[str, Any]) -> Dict[str, Any]:
        self._validate_guild_id(guild_id)
        
        async with self.session.post(
            f"{self.base_url}/guilds/message/{guild_id}/{setting_type}",
            json=data
        ) as resp:
            if not resp.ok:
                raise Exception(f"Failed to save {setting_type} settings")
            return await resp.json()

    async def delete_message_setting(self, guild_id: str, setting_type: Literal['welcome', 'goodbye']) -> Dict[str, Any]:
        self._validate_guild_id(guild_id)
        
        async with self.session.delete(f"{self.base_url}/guilds/message/{guild_id}/{setting_type}") as resp:
            if not resp.ok:
                raise Exception(f"Failed to delete {setting_type} settings")
            return await resp.json()

    # --- Embed Settings ---

    async def fetch_embed_settings(self, guild_id: str) -> List[Dict[str, Any]]:
        self._validate_guild_id(guild_id)
        
        async with self.session.get(f"{self.base_url}/guilds/embeds/{guild_id}") as resp:
            if not resp.ok:
                return []
            return await resp.json()

    async def save_embed_setting(self, guild_id: str, name: str, embed_data: Dict[str, Any]) -> Dict[str, Any]:
        self._validate_guild_id(guild_id)
        
        payload = {"name": name, "data": embed_data}
        async with self.session.post(
            f"{self.base_url}/guilds/embeds/{guild_id}",
            json=payload
        ) as resp:
            if not resp.ok:
                raise Exception("Failed to save embed setting")
            return await resp.json()

    async def delete_embed_setting(self, guild_id: str, name: str) -> Dict[str, Any]:
        self._validate_guild_id(guild_id)
        
        async with self.session.delete(f"{self.base_url}/guilds/embeds/{guild_id}/{name}") as resp:
            if not resp.ok:
                raise Exception("Failed to delete embed setting")
            return await resp.json()
        
    async def get_level_setting(self, guild_id: str) -> Dict[str, Any]:
        async with self.session.get(f"{self.base_url}/guilds/levels/{guild_id}") as response:
            if response.status != 200:
                return {
                    "channel_id": None,
                    "content": None,
                    "embed_id": None
                }
            return await response.json()

    async def save_level_setting(self, guild_id: str, channel_id: str, content: str, embed_id: Optional[int]) -> Dict[str, Any]:
        payload = {
            "content": content,
            "embed_id": embed_id,
            "channel_id": channel_id
        }
        async with self.session.post(f"{self.base_url}/guilds/levels/{guild_id}", json=payload) as response:
            if response.status != 200:
                raise Exception("Failed to save embed setting")
            return await response.json()

    async def delete_level_setting(self, guild_id: str) -> Dict[str, Any]:
        async with self.session.delete(f"{self.base_url}/guilds/levels/{guild_id}") as response:
            if response.status != 200:
                raise Exception("Failed to delete embed setting")
            return await response.json()

    async def get_level_rewards(self, guild_id: str) -> List[Dict[str, Any]]:
        async with self.session.get(f"{self.base_url}/guilds/levels/{guild_id}/rewards") as response:
            if response.status != 200:
                return []
            return await response.json()

    async def save_level_rewards(self, guild_id: str, rewards: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        async with self.session.post(f"{self.base_url}/guilds/levels/{guild_id}/rewards", json=rewards) as response:
            if response.status != 200:
                raise Exception("Failed to save level rewards")
            return await response.json()

    async def delete_level_reward(self, guild_id: str, level: int) -> Dict[str, Any]:
        async with self.session.delete(f"{self.base_url}/guilds/levels/{guild_id}/rewards/{level}") as response:
            if response.status != 200:
                raise Exception("Failed to delete level reward")
            return await response.json()

    async def get_user_level(self, guild_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        url = f"{self.base_url}/guilds/levels/{guild_id}/users/{user_id}"
        
        async with self.session.get(url) as response:
            if response.status == 404:
                return None
            
            return await response.json()

    async def save_user_level(self, guild_id: str, user_id: str, level: int, xp: int) -> Dict[str, Any]:
        url = f"{self.base_url}/guilds/levels/{guild_id}/users/{user_id}"
        payload = {
            "level": level,
            "xp": xp
        }
        
        async with self.session.post(url, json=payload) as response:
            response.raise_for_status()
            return await response.json()

    async def add_xp(self, guild_id: str, user_id: str, xp_to_add: int):
        current = await self.get_user_level(guild_id, user_id)
        
        current_level = current.get("level", 1) if current else 1
        current_xp = current.get("xp", 0) if current else 0
        
        new_xp = current_xp + xp_to_add
        
        return await self.save_user_level(guild_id, user_id, current_level, new_xp)
    
    async def get_level_leaderboard(self, guild_id: str):
        url = f"{self.base_url}/guilds/levels/{guild_id}/leaderboard"
        
        async with self.session.get(url) as response:
            if response.status == 404:
                return None
            
            response.raise_for_status()
            return await response.json()

    async def get_economy_settings(self, guild_id: str) -> Dict[str, Any]:
        async with self.session.get(f"{self.base_url}/guilds/economy/{guild_id}") as response:
            if response.status != 200:
                return {
                    "guild_id": guild_id
                }
            return await response.json()
        
    async def create_economy_item(
        self, 
        guild_id: str, 
        name: str, 
        price: int, 
        item_type: str, 
        role_id: Optional[str] = None, 
        auto_use: bool = False, 
        can_buy: bool = True, 
        can_buy_multiple: bool = True
    ) -> Dict[str, Any]:
        payload = {
            "name": name,
            "price": price,
            "type": item_type,
            "role_id": role_id,
            "auto_use": auto_use,
            "can_buy": can_buy,
            "can_buy_multiple": can_buy_multiple
        }

        async with self.session.post(f"{self.base_url}/guilds/economy/{guild_id}/items", json=payload) as response:
            response.raise_for_status()
            return await response.json()
        
    async def delete_economy_item(self, guild_id: str, item_id: str) -> Dict[str, Any]:
        async with self.session.delete(f"{self.base_url}/guilds/economy/{guild_id}/items/{item_id}") as response:
            response.raise_for_status()
            return await response.json()
        
    async def get_economy_items(self, guild_id: str) -> List[Dict[str, Any]]:
        async with self.session.get(f"{self.base_url}/guilds/economy/{guild_id}/items") as response:
            response.raise_for_status()
            return await response.json()
        
    async def get_economy_user(self, guild_id: str, user_id: str) -> Dict[str, Any]:
        async with self.session.get(f"{self.base_url}/guilds/economy/{guild_id}/users/{user_id}") as response:
            response.raise_for_status()
            return await response.json()
        
    async def save_user_setting(
        self, 
        guild_id: str, 
        user_id: str, 
        money: Optional[int] = None, 
        item_ids: Optional[List[int]] = None
    ) -> Dict[str, Any]:
        payload = {}
        if money is not None:
            payload["money"] = money
        if item_ids is not None:
            payload["item_ids"] = item_ids
            
        url = f"{self.base_url}/guilds/economy/{guild_id}/users/{user_id}"
        
        async with self.session.post(url, json=payload) as response:
            response.raise_for_status() 
            return await response.json()

    async def get_cooldown(self, guild_id: str, user_id: str) -> Dict[str, Any]:
        url = f"{self.base_url}/guilds/economy/{guild_id}/users/{user_id}/cooldown"
        async with self.session.get(url) as resp:
            resp.raise_for_status()
            return await resp.json()

    async def update_cooldown(self, guild_id: str, user_id: str, cooldown_type: str):
        url = f"{self.base_url}/guilds/economy/{guild_id}/users/{user_id}/cooldown"
        payload = {"type": cooldown_type}
        async with self.session.post(url, json=payload) as resp:
            resp.raise_for_status()
            return await resp.json()

    async def get_moderator_settings(self, guild_id: str) -> Dict[str, Any]:
        async with self.session.get(f"{self.base_url}/guilds/moderator/{guild_id}") as resp:
            resp.raise_for_status()
            return await resp.json()

    async def update_moderator_settings(
        self, 
        guild_id: str, 
        log_channel_id: str
    ) -> Dict[str, Any]:
        payload = {"log_channel_id": log_channel_id}
        async with self.session.post(
            f"{self.base_url}/guilds/moderator/{guild_id}", 
            json=payload
        ) as resp:
            resp.raise_for_status()
            return await resp.json()

    async def get_all_automod_settings(self, guild_id: str) -> Dict[str, Any]:
        async with self.session.get(f"{self.base_url}/guilds/automod/{guild_id}/all") as resp:
            resp.raise_for_status()
            return await resp.json()

    async def get_automod_setting(self, guild_id: str, mod_type: str) -> Dict[str, Any]:
        async with self.session.get(f"{self.base_url}/guilds/automod/{guild_id}/{mod_type}") as resp:
            resp.raise_for_status()
            return await resp.json()

    async def update_automod_setting(
        self,
        guild_id: str,
        mod_type: str,
        actions: List[str],
        whitelist_channel_ids: Optional[List[str]] = None,
        whitelist_role_ids: Optional[List[str]] = None,
        badwords: Optional[List[str]] = None,
        allowed_links: Optional[List[str]] = None,
        allow_only_verified: Optional[bool] = None
    ) -> Dict[str, Any]:
        payload = {
            "guild_id": guild_id,
            "type": mod_type,
            "actions": actions,
            "whitelist_channel_ids": whitelist_channel_ids or [],
            "whitelist_role_ids": whitelist_role_ids or [],
        }

        if badwords is not None:
            payload["badwords"] = badwords
        if allowed_links is not None:
            payload["allowed_links"] = allowed_links
        if allow_only_verified is not None:
            payload["allow_only_verified"] = allow_only_verified

        async with self.session.post(
            f"{self.base_url}/guilds/automod/{guild_id}/{mod_type}",
            json=payload
        ) as resp:
            resp.raise_for_status()
            return await resp.json()

    async def delete_automod_setting(self, guild_id: str, mod_type: str) -> bool:
        async with self.session.delete(f"{self.base_url}/guilds/automod/{guild_id}/{mod_type}") as resp:
            return resp.status == 204
        
    async def get_logging_setting(self, guild_id: str) -> Optional[Dict[str, Any]]:
        async with self.session.get(f"{self.base_url}/guilds/logging/{guild_id}") as resp:
            if resp.status == 200:
                return await resp.json()
            return None

    async def save_logging_setting(self, guild_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        async with self.session.post(f"{self.base_url}/guilds/logging/{guild_id}", json=data) as resp:
            if resp.status == 200:
                return await resp.json()
            return None

    async def delete_logging_setting(self, guild_id: str) -> bool:
        async with self.session.delete(f"{self.base_url}/guilds/logging/{guild_id}") as resp:
            return resp.status == 200

    async def set_logging_event(self, guild_id: str, event_name: str, event_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        url = f"{self.base_url}/guilds/logging/{guild_id}/event/{event_name}"
        async with self.session.post(url, json=event_data) as resp:
            if resp.status == 200:
                return await resp.json()
            return None

    async def delete_logging_event(self, guild_id: str, event_name: str) -> Optional[Dict[str, Any]]:
        url = f"{self.base_url}/guilds/logging/{guild_id}/event/{event_name}"
        async with self.session.delete(url) as resp:
            if resp.status == 200:
                return await resp.json()
            return None
        
    async def get_event_config(self, guild_id: str, event_name: str) -> Optional[LoggingEvent]:
        url = f"{self.base_url}/guilds/logging/{guild_id}/event/{event_name}"
        async with self.session.get(url) as resp:
            if resp.status == 200:
                data = await resp.json()
                return LoggingEvent.from_dict(data)
            return None
        
    async def globalchat_get_channel_config(self, channel_id: int) -> Optional[Dict[str, Any]]:
        url = f"{self.base_url}/globalchat/channels/{channel_id}"
        async with self.session.get(url) as resp:
            if resp.status == 200:
                return await resp.json()
            return None

    async def globalchat_get_active_channel_ids(self) -> List[str]:
        url = f"{self.base_url}/globalchat/active-channels"
        async with self.session.get(url) as resp:
            if resp.status == 200:
                data = await resp.json()
                return data.get("active_channels", [])
            return []

    async def globalchat_get_active_channel_ids_byname(self, name: str) -> List[str]:
        url = f"{self.base_url}/globalchat/rooms/{name}"
        async with self.session.get(url) as resp:
            if resp.status == 200:
                data = await resp.json()
                return data
            return {}

    async def globalchat_connect_channel(self, channel_id: int, guild_id: int, room_name: str, webhook_url: str):
        url = f"{self.base_url}/globalchat/connect"
        payload = {
            "channel_id": str(channel_id),
            "guild_id": str(guild_id),
            "room_name": room_name,
            "webhook_url": webhook_url
        }
        async with self.session.post(url, json=payload) as resp:
            return resp.status == 200

    async def globalchat_disconnect_channel(self, channel_id: int) -> bool:
        url = f"{self.base_url}/globalchat/connect/{channel_id}"
        async with self.session.delete(url, headers=self.headers) as resp:
            return resp.status == 204