export async function getGuilds(accessToken: string) {
  const res = await fetch("https://discord.com/api/users/@me/guilds", {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })

  if (!res.ok) throw new Error("取得失敗")

  return res.json()
}