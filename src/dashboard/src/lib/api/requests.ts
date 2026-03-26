import { RESOURCE_API_BASE_URL } from "@/constants/api/endpoints";

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