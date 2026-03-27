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
    if (!response.ok) return null;
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