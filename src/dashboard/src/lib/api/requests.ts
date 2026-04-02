import { RESOURCE_API_BASE_URL } from "@/constants/api/endpoints";

export interface EmbedSetting {
    ID?: number;
    guild_id: string;
    name: string;
    data: Record<string, any>; // DiscordのEmbed Dict
    updated_at?: string;
}

export interface MessageSetting {
    guild_id: string;
    type: 'welcome' | 'goodbye';
    channel_id: string;
    content: string;
    embed_id: number | null;
    embed?: EmbedSetting; // Preloadされたデータ用
    updated_at?: string;
}

export interface LoggingEvent {
    event_name: string;
    log_channel_id: string;
    webhook_url?: string | null;
    ignored_channels: string[]; 
}

export interface LoggingSetting {
    guild_id: string;
    events: LoggingEvent[];
    global_ignored_channels: string[]; 
    created_at?: string;
    updated_at?: string;
}

export interface PinMessageSetting {
    guild_id: string;
    channel_id: string;
    last_message_id: string;
    content: string;
    embed_id: string;
    created_at?: string;
    updated_at?: string;
}

export interface TicketPanel {
  id: string;
  name: string;
  targetChannelId: string;
  embedId: string;
  content: string;
  panelButtons: any[]; // 実際には TicketButtonConfig[]
  categoryId: string;
  logChannelId: string;
  staffRoleIds: string[];
  mentionRoleIds: string[];
  nameTemplate: string;
  cooldown: number;
  ticketLimit: number;
  innerButtons: any[];
  innerEmbedId: string,
  innerContent: string
}

const isValidDiscordId = (id: string) => /^\d{17,20}$/.test(id);

export async function createGuildEntry(guildId: string) {
    if (!isValidDiscordId(guildId)) {
        throw new Error("Invalid Guild ID");
    }
    const data = await fetch(`${RESOURCE_API_BASE_URL}/guilds/${guildId}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ id: guildId, EnabledModules: {
            "help": true,
        } })
    });
    if (!data.ok) {
        throw new Error(`Failed to create guild entry: ${data.statusText}`);
    }
    return data.json();

}

export async function fetchGuildSettings(guildId: string) {
    if (!isValidDiscordId(guildId)) {
        throw new Error("Invalid Guild ID");
    }
    if (!guildId) {
        throw new Error("Guild ID is required");
    }
    const data = await fetch(`${RESOURCE_API_BASE_URL}/guilds/${guildId}`);
    if (!data.ok) {
        await createGuildEntry(guildId);
        return;
    }
    return data.json();
}

export async function isModuleEnabled(guildId: string, moduleName: string) {
    if (!isValidDiscordId(guildId)) {
        throw new Error("Invalid Guild ID");
    }
    if (!guildId) {
        throw new Error("Guild ID is required");
    }
    const data = await fetch(`${RESOURCE_API_BASE_URL}/guilds/${guildId}/module?module=${encodeURIComponent(moduleName)}`);
    if (!data.ok) {
        throw new Error(`Failed to fetch module status: ${data.statusText}`);
    }
    return data.json();
}

export async function setModuleStatus(guildId: string, moduleName: string) {
    if (!isValidDiscordId(guildId)) {
        throw new Error("Invalid Guild ID");
    }
    if (!guildId) {
        throw new Error("Guild ID is required");
    }
    const data = await fetch(`${RESOURCE_API_BASE_URL}/guilds/${guildId}/module?module=${encodeURIComponent(moduleName)}`, {
        method: "PATCH",
    });
    if (!data.ok) {
        throw new Error(`Failed to update module status: ${data.statusText}`);
    }
    return data.json();
}

export async function fetchMessageSetting(guildId: string, type: 'welcome' | 'goodbye'): Promise<MessageSetting | null> {
    if (!isValidDiscordId(guildId)) throw new Error("Invalid Guild ID");

    const response = await fetch(`${RESOURCE_API_BASE_URL}/guilds/message/${guildId}/${type}`);
    
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`Failed to fetch ${type} settings`);

    return response.json();
}

/**
 * 通知設定を保存・更新
 */
export async function saveMessageSetting(guildId: string, type: 'welcome' | 'goodbye', data: Partial<MessageSetting>) {
    const response = await fetch(`${RESOURCE_API_BASE_URL}/guilds/message/${guildId}/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        throw new Error(`Failed to save ${type} settings: ${response.statusText}`);
        return
    };
    return response.json();
}

/**
 * 通知設定を削除
 */
export async function deleteMessageSetting(guildId: string, type: 'welcome' | 'goodbye') {
    const response = await fetch(`${RESOURCE_API_BASE_URL}/guilds/message/${guildId}/${type}`, {
        method: "DELETE",
    });

    if (!response.ok) throw new Error(`Failed to delete ${type} settings`);
    return response.json();
}

// --- 埋め込み設定 (Embeds) ---

/**
 * サーバー内のEmbed設定一覧を取得
 */
export async function fetchEmbedSettings(guildId: string): Promise<EmbedSetting[]> {
    const response = await fetch(`${RESOURCE_API_BASE_URL}/guilds/embeds/${guildId}`);
    if (!response.ok) return [];
    return response.json();
}

/**
 * Embed設定を保存・更新
 */
export async function saveEmbedSetting(guildId: string, name: string, embedData: Record<string, any>) {
    const response = await fetch(`${RESOURCE_API_BASE_URL}/guilds/embeds/${guildId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, data: embedData }),
    });

    if (!response.ok) throw new Error("Failed to save embed setting");
    return response.json();
}

/**
 * 特定のEmbed設定を削除
 */
export async function deleteEmbedSetting(guildId: string, name: string) {
    const response = await fetch(`${RESOURCE_API_BASE_URL}/guilds/embeds/${guildId}/${name}`, {
        method: "DELETE",
    });

    if (!response.ok) throw new Error("Failed to delete embed setting");
    return response.json();
}

export async function getLevelSetting(guildId: string) {
    const response = await fetch(`${RESOURCE_API_BASE_URL}/guilds/levels/${guildId}`);
    if (!response.ok) return {
        channel_id: null,
        content: null,
        embed_id: null
    };
    return response.json();
}

export async function saveLevelSetting(guildId: string, channel_id: string, content: string, embed_id: number | null) {
    const response = await fetch(`${RESOURCE_API_BASE_URL}/guilds/levels/${guildId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, embed_id, channel_id }),
    });

    if (!response.ok) throw new Error("Failed to save embed setting");
    return response.json();
}

export async function deleteLevelSetting(guildId: string) {
    const response = await fetch(`${RESOURCE_API_BASE_URL}/guilds/levels/${guildId}`, {
        method: "DELETE",
    });

    if (!response.ok) throw new Error("Failed to delete embed setting");
    return response.json();
}

export async function getLevelRewards(guildId: string) {
    const response = await fetch(`${RESOURCE_API_BASE_URL}/guilds/levels/${guildId}/rewards`);
    if (!response.ok) return [];
    return response.json();
}

export async function saveLevelRewards(guildId: string, rewards: { level: number; role_id: string }[]) {
    const response = await fetch(`${RESOURCE_API_BASE_URL}/guilds/levels/${guildId}/rewards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rewards),
    });

    if (!response.ok) throw new Error("Failed to save level rewards");
    return response.json();
}

export async function deleteLevelReward(guildId: string, level: number) {
    const response = await fetch(`${RESOURCE_API_BASE_URL}/guilds/levels/${guildId}/rewards/${level}`, {
        method: "DELETE",
    });

    if (!response.ok) throw new Error("Failed to delete level reward");
    return response.json();
}

export async function getEconomySetting(guildId: string) {
    const response = await fetch(`${RESOURCE_API_BASE_URL}/guilds/economy/${guildId}`);

    if (!response.ok) {
        throw new Error("Failed to fetch economy settings");
    }

    return response.json();
}

export async function getEconomyItems(guildId: string) {
    const response = await fetch(`${RESOURCE_API_BASE_URL}/guilds/economy/${guildId}/items`);

    if (!response.ok) {
        throw new Error("Failed to fetch economy items");
    }

    return response.json();
}

export async function fetchModeratorSettings(guildId: string) {
    const response = await fetch(`${RESOURCE_API_BASE_URL}/guilds/moderator/${guildId}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch moderator settings: ${response.statusText}`);
    };
    return response.json();
}

export async function fetchAutomodSettings(guildId: string, type: string) {
    const response = await fetch(`${RESOURCE_API_BASE_URL}/guilds/automod/${guildId}/${type}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch automod settings: ${response.statusText}`);
    };
    return response.json();
}

export async function fetchLoggingSetting(guildId: string): Promise<LoggingSetting> {
    const response = await fetch(`${RESOURCE_API_BASE_URL}/guilds/logging/${guildId}`);
    if (!response.ok) {
        if (response.status === 404) return { guild_id: guildId, events: [], global_ignored_channels: [] };
        throw new Error(`Failed to fetch logging settings: ${response.statusText}`);
    }
    return response.json();
}

export async function saveLoggingSetting(guildId: string, data: Partial<LoggingSetting>) {
    const response = await fetch(`${RESOURCE_API_BASE_URL}/guilds/logging/${guildId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        throw new Error(`Failed to save logging settings: ${response.statusText}`);
    }
    return response.json();
}

export async function saveOneLoggingEvent(guildId: string, eventName: string, data: LoggingEvent) {
    const encodedEventName = encodeURIComponent(eventName);
    const response = await fetch(`${RESOURCE_API_BASE_URL}/guilds/logging/${guildId}/event/${encodedEventName}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        throw new Error(`Failed to save event setting: ${response.statusText}`);
    }
    return response.json();
}

export async function deleteOneLoggingEvent(guildId: string, eventName: string) {
    const encodedEventName = encodeURIComponent(eventName);
    const response = await fetch(`${RESOURCE_API_BASE_URL}/guilds/logging/${guildId}/event/${encodedEventName}`, {
        method: "DELETE",
    });
    if (!response.ok) {
        throw new Error(`Failed to delete event setting: ${response.statusText}`);
    }
    return response.json();
}

export async function deleteLoggingSetting(guildId: string) {
    const response = await fetch(`${RESOURCE_API_BASE_URL}/guilds/logging/${guildId}`, {
        method: "DELETE",
    });
    if (!response.ok) {
        throw new Error(`Failed to delete logging settings: ${response.statusText}`);
    }
    return response.json();
}

export async function getGlobalChatConfig(name: string) {
    const res = await fetch(`${RESOURCE_API_BASE_URL}/globalchat/rooms/${encodeURI(name)}`)
    if (!res.ok) {
        throw new Error(`$Failed to get settings: ${res.statusText}`)
    }
    return await res.json();
}

export async function getGlobalChatRole(name: string, userId: string) {
    const encodedName = encodeURIComponent(name);
    
    const encodedUserId = encodeURIComponent(userId);

    const url = `${RESOURCE_API_BASE_URL}/globalchat/rooms/${encodedName}/role?user_id=${encodedUserId}`;

    const res = await fetch(url, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
        cache: 'no-store' 
    });

    if (!res.ok) {
        throw new Error(`Failed to get role: ${res.statusText} (Status: ${res.status})`);
    }

    return await res.json();
}

export async function getCommands(guildId: string) {
    const url = `${RESOURCE_API_BASE_URL}/commands/${guildId}`;

    const res = await fetch(url, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
        cache: 'no-store' 
    });

    if (!res.ok) {
        throw new Error(`Failed to get commands: ${res.statusText} (Status: ${res.status})`);
    }

    return await res.json();
}

export async function getCommandPrefix(guildId: string) {
    const url = `${RESOURCE_API_BASE_URL}/commands/${guildId}/prefixs`;

    const res = await fetch(url, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
        cache: 'no-store' 
    });

    if (!res.ok) {
        throw new Error(`Failed to get prefixs: ${res.statusText} (Status: ${res.status})`);
    }

    return await res.json();
}

export async function getPinSetting(guildId: string): Promise<PinMessageSetting[]> {
    const resp = await fetch(`${RESOURCE_API_BASE_URL}/guilds/pin/${guildId}`, {
        method: "GET",
    });

    if (!resp.ok) {
        throw new Error(`Failed to get Pins: ${resp.statusText}`);
    };
    return resp.json();
}

export async function createPin(guildId: string, data: Partial<PinMessageSetting>): Promise<PinMessageSetting> {
    const resp = await fetch(`${RESOURCE_API_BASE_URL}/guilds/pin/${guildId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    if (!resp.ok) throw new Error(`Failed to get Pins: ${resp.statusText}`);
    return resp.json();
}

export async function deletePin(guildId: string, channelId: string): Promise<boolean> {
    const params = new URLSearchParams({ channel_id: channelId });
    const resp = await fetch(`${RESOURCE_API_BASE_URL}/guilds/pin/${guildId}?${params}`, {
        method: "DELETE",
    });
    
    return resp.ok;
}

export default async function getTicketSettings(guildId: string): Promise<TicketPanel[]> {
  const response = await fetch(`${RESOURCE_API_BASE_URL}/guilds/ticket/${guildId}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch ticket settings");
  }

  const data = await response.json();
  return data.panels || [];
}

export async function saveTicketPanels(guildId: string, panels: TicketPanel[]): Promise<void> {
  const response = await fetch(`${RESOURCE_API_BASE_URL}/guilds/ticket/${guildId}/save-all`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ panels }),
  });

  if (!response.ok) {
    throw new Error("Failed to save ticket settings");
  }
}

export async function deleteTicketPanel(guildId: string, panelId: string): Promise<void> {
  const response = await fetch(`${RESOURCE_API_BASE_URL}/guilds/ticket/${guildId}/${panelId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error("Failed to delete panel");
  }
}

export async function checkCooldown(key: string, value: string, seconds: number) {
  const url = `${RESOURCE_API_BASE_URL}/cooldowns/${encodeURIComponent(key)}/${value}?seconds=${seconds}`;

  try {
    const resp = await fetch(url, { method: "POST" });

    if (resp.status === 200) {
      return { status: "ok" };
    }

    if (resp.status === 429) {
      const data = await resp.json();
      return {
        status: "limit",
        remaining: data.remaining_seconds || 0,
      };
    }

    return { status: "error", code: resp.status };
  } catch (e: any) {
    return { status: "error", message: e.message };
  }
}

async function achievementsApiRequest<T>(method: string, path: string, body?: any): Promise<T> {
  const response = await fetch(`${RESOURCE_API_BASE_URL}/achievements${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export async function getAchievementSettings(guildId: string) {
  return achievementsApiRequest<any>("GET", `/settings/${guildId}`);
}

export async function updateAchievementSettings(guildId: string, data: any) {
  return achievementsApiRequest<any>("POST", `/settings/${guildId}`, data);
}

export async function getAchievementList(guildId: string) {
  return achievementsApiRequest<any[]>("GET", `/list/${guildId}`);
}

export async function saveAchievement(guildId: string, data: any) {
  return achievementsApiRequest<any>("POST", `/list/${guildId}`, data);
}

export async function deleteAchievement(guildId: string, achievementId: number) {
  return achievementsApiRequest<{ message: string }>("DELETE", `/list/${guildId}/${achievementId}`);
}

export async function getUserProgress(guildId: string, userId: string) {
  return achievementsApiRequest<any[]>("GET", `/progress/${guildId}/${userId}`);
}

export async function updateUserProgress(
  guildId: string, 
  userId: string, 
  achievementId: number, 
  value: number
) {
  return achievementsApiRequest<any>("POST", `/progress/${guildId}/${userId}`, {
    achievement_id: achievementId,
    current_value: value,
  });
}

export async function getAuthCode(guildId: string, code: string) {
    const res = await fetch(`${RESOURCE_API_BASE_URL}/auth/code/${guildId}/${code}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
    });

    if (!res.ok) {
        throw new Error(res.status === 404 ? "コードが見つからないか、期限切れです。" : "サーバーエラーが発生しました。");
    }

    return res.json();
}

export async function deleteAuthCode(guildId: string, code: string) {
    const res = await fetch(`${RESOURCE_API_BASE_URL}/auth/code/${guildId}/${code}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" }
    });

    if (!res.ok) {
        console.log(res.statusText)
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "認証の確定に失敗しました。");
    }

    return res.json();
}

export async function getAuthBlockGuilds(guildId: string) {
    const res = await fetch(`${RESOURCE_API_BASE_URL}/auth/blockguilds/${guildId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
    });

    if (res.status === 404) {
        return { blockd_guilds: [] };
    }

    if (!res.ok) {
        throw new Error(`Failed to fetch auth block guilds: ${res.statusText}`);
    }
    
    return res.json();
}

export async function updateAuthBlockGuilds(guildId: string, blockdGuildIds: string[]) {
    const res = await fetch(`${RESOURCE_API_BASE_URL}/auth/blockguilds/${guildId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockd_guilds: blockdGuildIds }),
    });

    if (!res.ok) {
        throw new Error("設定の保存に失敗しました。");
    }

    return res.json();
}

export async function getInviteSetting(
  guildId: string
) {
  const res = await fetch(`${RESOURCE_API_BASE_URL}/invites/settings/${guildId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    }
  });

  if (!res.ok) {
    throw new Error("Failed to get invite setting");
  }

  return await res.json();
}

export async function saveInviteSetting(
  guildId: string,
  channelId: string,
  content: string,
  embed_id: string
) {
  const res = await fetch(`${RESOURCE_API_BASE_URL}/invites/settings/${guildId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      channel_id: channelId,
      content: content,
      embed_id: embed_id
    }),
  });

  if (!res.ok) {
    throw new Error("Failed to save invite setting");
  }

  return await res.json();
}