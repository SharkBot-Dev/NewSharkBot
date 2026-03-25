import { headers } from "next/headers";
import { DISCORD_API_BASE_URL } from "@/constants/Discord/endpoints";
import { auth } from "@/lib/auth";
import type { DiscordGuild } from "@/types/Discord";

const ADMIN_PERMISSION = BigInt(0x8);

export async function GET() {
  const allLinkedAccounts = await auth.api.listUserAccounts({
    headers: await headers(),
  });
  const discordAccountData = allLinkedAccounts.find(
    (account) => account.providerId === "discord",
  );
  if (!discordAccountData) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const discordToken = await auth.api.getAccessToken({
    headers: await headers(),
    body: {
      providerId: "discord",
      accountId: discordAccountData.accountId,
      userId: discordAccountData.userId,
    },
  });

  if (
    !discordToken.accessTokenExpiresAt ||
    Date.now() >= new Date(discordToken.accessTokenExpiresAt).getTime()
  ) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const res = await fetch(`${DISCORD_API_BASE_URL}/users/@me/guilds`, {
      headers: {
        Authorization: `Bearer ${discordToken.accessToken}`,
      },
      next: {
        revalidate: 60,
        tags: [`guilds-${discordAccountData.accountId}`],
      },
    });

    if (!res.ok) {
      const errorData = await res.json();
      return Response.json(
        { error: "Discord API error", details: errorData },
        { status: res.status },
      );
    }

    const guilds: DiscordGuild[] = await res.json();

    const managedGuilds = guilds.map((g) => ({
      id: g.id,
      name: g.name,
      icon: g.icon,
      isAdmin: g.permissions
        ? (BigInt(g.permissions) & ADMIN_PERMISSION) === ADMIN_PERMISSION
        : false,
      permissions: g.permissions,
      owner: g.owner,
    }));

    return Response.json(managedGuilds);
  } catch (error) {
    console.error("Fetch error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
