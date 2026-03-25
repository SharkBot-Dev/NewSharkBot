const ADMIN_PERMISSION = BigInt(0x8);

const headers = {
  Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
  "Content-Type": "application/json",
};

export async function getGuildRequest(guildId: string) {
  try {
    const response = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}`,
      { 
        next: { revalidate: 60 },
        headers: headers
      },
    );

    console.log("Guild API Response:", response);

    if (!response.ok) {
      return null;
    }

    const guild = await response.json();
    return guild;
  } catch (error) {;
    return null;
  }
}

export async function getGuilds(accessToken: string) {
  const res = await fetch("https://discord.com/api/users/@me/guilds", {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })

  if (!res.ok) throw new Error("取得失敗")

  return res.json()
}

export async function checkAdminPermission(guildId: string, accessToken: string) {
  try {
    const res = await fetch("https://discord.com/api/users/@me/guilds", {
      headers: { Authorization: `Bearer ${accessToken}` },
      next: { revalidate: 60 }
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

  const url = `https://discord.com/api/v10/applications/${clientId}/guilds/${guildId}/commands`

  const response = await fetch(url, {
    method: "POST",
    headers: headers,
    body: JSON.stringify(commandData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to add command: ${JSON.stringify(error)}`);
  }

  return await response.json();
}

export async function getSlashCommands(guildId: string) {
  const clientId = process.env.AUTH_DISCORD_ID;

  const url = `https://discord.com/api/v10/applications/${clientId}/guilds/${guildId}/commands`

  const response = await fetch(url, {
    method: "GET",
    headers,
    next: { revalidate: 15 }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to fetch commands: ${JSON.stringify(error)}`);
  }

  return await response.json();
}

export async function deleteSlashCommand(guildId: string, commandId: string) {
  const clientId = process.env.AUTH_DISCORD_ID;

  const url = `https://discord.com/api/v10/applications/${clientId}/guilds/${guildId}/commands/${commandId}`;
  
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