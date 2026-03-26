import { DISCORD_API_BASE_URL } from "@/constants/Discord/endpoints";
import type { DiscordGuild } from "@/types/Discord";

const isValidDiscordId = (id: string) => /^\d{17,20}$/.test(id);

const headers = {
  Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
  "Content-Type": "application/json",
};

export async function getAllJoinedGuilds(guildId: string) {
  try {
    const response = await fetch(`${DISCORD_API_BASE_URL}/guilds/${guildId}`, {
      next: { revalidate: 60 },
      headers: headers,
    });

    if (!response.ok) {
      return null;
    }

    const guild = (await response.json()) as DiscordGuild;
    return guild;
  } catch {
    return null;
  }
}

export async function getGuildChannels(guildId: string) {
  if (!isValidDiscordId(guildId)) {
    throw new Error("Invalid Guild ID");
  }
  const response = await fetch(`${DISCORD_API_BASE_URL}/guilds/${guildId}/channels`, {
    headers,
    next: { revalidate: 60 },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Failed to fetch channels: ${JSON.stringify(error)}`);
  }

  return await response.json();
}

export async function registerSlashCommand(guildId: string, commandData: any) {
  const clientId = process.env.AUTH_DISCORD_ID;

  if (!clientId || !isValidDiscordId(clientId) || !isValidDiscordId(guildId)) {
    throw new Error("Invalid Client ID or Guild ID");
  }

  const url = `${DISCORD_API_BASE_URL}/applications/${clientId}/guilds/${guildId}/commands`;

  const response = await fetch(url, {
    method: "POST",
    headers: headers,
    body: JSON.stringify(commandData),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Failed to add command: ${JSON.stringify(error)}`);
  }

  return await response.json();
}

export async function getAllSlashCommands(guildId: string) {
  const clientId = process.env.AUTH_DISCORD_ID;

  if (!clientId || !isValidDiscordId(clientId) || !isValidDiscordId(guildId)) {
    throw new Error("Invalid Client ID or Guild ID");
  }

  const url = `${DISCORD_API_BASE_URL}/applications/${clientId}/guilds/${guildId}/commands`;

  const response = await fetch(url, {
    method: "GET",
    headers,
    next: { revalidate: 5 },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Failed to fetch commands: ${JSON.stringify(error)}`);
  }

  return await response.json();
}

export async function deleteSlashCommand(guildId: string, commandId: string) {
  const clientId = process.env.AUTH_DISCORD_ID;

  if (
    !clientId ||
    !isValidDiscordId(clientId) ||
    !isValidDiscordId(guildId) ||
    !isValidDiscordId(commandId)
  ) {
    throw new Error("Invalid ID parameters");
  }

  const url = `${DISCORD_API_BASE_URL}/applications/${clientId}/guilds/${guildId}/commands/${commandId}`;

  const response = await fetch(url, {
    method: "DELETE",
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Failed to delete command: ${JSON.stringify(error)}`);
  }

  return true;
}
