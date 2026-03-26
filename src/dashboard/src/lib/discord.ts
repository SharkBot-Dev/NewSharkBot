import { DISCORD_API_BASE_URL } from "@/constants/Discord/endpoints";

const ADMIN_PERMISSION = BigInt(0x8);

const isValidDiscordId = (id: string) => /^\d{17,20}$/.test(id);

const headers = {
  Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
  "Content-Type": "application/json",
};

export async function getGuildRequest(guildId: string) {
  try {
    const response = await fetch(`${DISCORD_API_BASE_URL}/guilds/${guildId}`, {
      next: { revalidate: 60 },
      headers: headers,
    });

    if (!response.ok) {
      return null;
    }

    const guild = await response.json();
    return guild;
  } catch {
    return null;
  }
}

export async function getGuilds(accessToken: string) {
  const res = await fetch(`${DISCORD_API_BASE_URL}/users/@me/guilds`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) throw new Error("取得失敗");

  return res.json();
}

export async function getGuildChannels(guildId: string) {
  try {
    const res = await fetch(`${DISCORD_API_BASE_URL}/guilds/${guildId}/channels`, {
      headers: headers,
      next: { revalidate: 30 },
    });
    if (!res.ok) throw new Error("取得失敗");
    return res.json();
  } catch {
    return [];
  }

}

export async function checkAdminPermission(
  guildId: string,
  accessToken: string,
) {
  try {
    const res = await fetch(`${DISCORD_API_BASE_URL}/users/@me/guilds`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      next: { revalidate: 60 },
    });

    if (!res.ok) return false;

    const guilds: any[] = await res.json();
    const guild = guilds.find((g) => g.id === guildId);

    if (!guild) return false;

    return (BigInt(guild.permissions) & ADMIN_PERMISSION) === ADMIN_PERMISSION;
  } catch {
    return false;
  }
}

export async function addSlashCommand(guildId: string, commandData: any) {
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

export async function getSlashCommands(guildId: string) {
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
