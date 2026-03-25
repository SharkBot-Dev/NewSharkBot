import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkAdminPermission } from "@/lib/discord";
import clientPromise from "@/lib/mongodb";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ guildId: string }> },
) {
  const { guildId } = await params;

  const { searchParams } = new URL(request.url);
  const targetModule = searchParams.get("module");

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

  const hasPermission = await checkAdminPermission(
    guildId,
    discordToken.accessToken,
  );
  if (!hasPermission) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const client = await clientPromise;
    const db = client.db("SharkBot");

    let settings = (await db
      .collection("module_setting")
      .findOne({ guildId })) as any;

    if (!settings) {
      const defaultSettings = {
        guildId,
        modules: { test: false },
      };
      await db.collection("module_setting").insertOne(defaultSettings);
      settings = defaultSettings;
    }

    if (targetModule) {
      const isEnabled = !!settings.modules?.[targetModule];
      return NextResponse.json({
        module: targetModule,
        enabled: isEnabled,
      });
    }

    return NextResponse.json(settings);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to fetch module settings" },
      { status: 500 },
    );
  }
}
