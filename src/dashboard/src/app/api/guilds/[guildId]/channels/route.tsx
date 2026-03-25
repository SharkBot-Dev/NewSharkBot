import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkAdminPermission, getGuildChannels } from "@/lib/discord";
import clientPromise from "@/lib/mongodb";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ guildId: string }> },
) {
  const { guildId } = await params;
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
      return Response.json({ error: "Unauthorized" }, { status: 401 });
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
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (
    !discordToken.accessTokenExpiresAt ||
    Date.now() >= new Date(discordToken.accessTokenExpiresAt).getTime()
  ) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hasPermission = await checkAdminPermission(
    guildId,
    discordToken.accessToken,
  );
  if (!hasPermission) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const channels = await getGuildChannels(guildId);

    return NextResponse.json(channels);
  } catch {
    return NextResponse.json({ error: "DB接続エラー" }, { status: 500 });
  }
}
