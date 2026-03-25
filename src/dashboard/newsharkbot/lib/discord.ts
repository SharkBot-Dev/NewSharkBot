const ADMIN_PERMISSION = BigInt(0x8);

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