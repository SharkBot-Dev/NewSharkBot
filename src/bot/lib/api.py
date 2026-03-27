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