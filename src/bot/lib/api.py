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
        url = f"{self.base_url}/guilds/{guild_id}/users/{user_id}"
        
        async with self.session.get(url) as response:
            if response.status == 404:
                return None
            
            response.raise_for_status()
            return await response.json()

    async def save_user_level(self, guild_id: str, user_id: str, level: int, xp: int) -> Dict[str, Any]:
        url = f"{self.base_url}/guilds/{guild_id}/users/{user_id}"
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