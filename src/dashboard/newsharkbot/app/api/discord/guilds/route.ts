import { auth } from "@/app/auth"

const ADMIN_PERMISSION = BigInt(0x8);

export async function GET() {
  const session = await auth()

  if (!session?.accessToken || !session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const res = await fetch("https://discord.com/api/users/@me/guilds", {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
      next: { revalidate: 60, tags: [`guilds-${session.user.id}`] } 
    })

    if (!res.ok) {
      const errorData = await res.json();
      return Response.json({ error: "Discord API error", details: errorData }, { status: res.status })
    }

    const guilds: any[] = await res.json()

    const managedGuilds = guilds.map((g) => ({
      id: g.id,
      name: g.name,
      icon: g.icon,
      isAdmin: (BigInt(g.permissions) & ADMIN_PERMISSION) === ADMIN_PERMISSION,
      permissions: g.permissions,
      owner: g.owner
    }))

    return Response.json(managedGuilds)

  } catch (error) {
    console.error("Fetch error:", error)
    return Response.json({ error: "Internal Server Error" }, { status: 500 })
  }
}