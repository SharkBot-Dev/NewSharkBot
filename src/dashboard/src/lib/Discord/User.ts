import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { DISCORD_API_BASE_URL } from "@/constants/Discord/endpoints";
import type { DiscordGuild } from "@/types/Discord";
import { auth } from "../auth";

const ADMIN_PERMISSION = BigInt(0x8);

export async function getUsersGuilds(accessToken: string) {
  const res = await fetch(`${DISCORD_API_BASE_URL}/users/@me/guilds`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) throw new Error("Failed to fetch user's guilds");

  return res.json();
}

export async function checkAdminPermission(
  guildId: string,
  accessToken: string,
) {
  const res = await fetch(`${DISCORD_API_BASE_URL}/users/@me/guilds`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch user's guilds: ${res.status}`);
  }

  const guilds: DiscordGuild[] = await res.json();
  const guild = guilds.find((g) => g.id === guildId);

  if (!guild) return false;

  return guild.permissions
    ? (BigInt(guild.permissions) & ADMIN_PERMISSION) === ADMIN_PERMISSION
    : false;
}

export async function getAccessToken() {
  let discordToken: {
    accessToken: string;
    accessTokenExpiresAt: Date | undefined;
    scopes: string[];
    idToken: string | undefined;
  };
  try {
    const allLinkedAccounts = await auth.api.listUserAccounts({
      headers: await headers(),
    });
    const discordAccountData = allLinkedAccounts.find(
      (account) => account.providerId === "discord",
    );
    if (!discordAccountData) {
      throw new Error("No linked Discord account found");
    }
    discordToken = await auth.api.getAccessToken({
      headers: await headers(),
      body: {
        providerId: "discord",
        accountId: discordAccountData.accountId,
        userId: discordAccountData.userId,
      },
    });
  } catch (e) {
    console.log("Error fetching access token:", e);
    throw new Error("Failed to fetch access token");
  }

  if (
    !discordToken.accessTokenExpiresAt ||
    Date.now() >= new Date(discordToken.accessTokenExpiresAt).getTime()
  ) {
    throw new Error("Access token expired");
  }
  return discordToken.accessToken;
}
