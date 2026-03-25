import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkAdminPermission } from "@/lib/discord";
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
    const client = await clientPromise;
    const db = client.db("SharkBot");

    let settings = await db.collection("module_setting").findOne({ guildId });

    if (!settings) {
      settings = {
        guildId,
        modules: { test: false },
      } as any;
      await db.collection("module_setting").insertOne(settings as any);
    }

    return NextResponse.json(settings);
  } catch {
    return NextResponse.json({ error: "DB接続エラー" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
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

  const { moduleId, enabled } = await request.json();

  try {
    const client = await clientPromise;
    const db = client.db("SharkBot");

    await db
      .collection("module_setting")
      .updateOne(
        { guildId },
        { $set: { [`modules.${moduleId}`]: enabled } },
        { upsert: true },
      );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to update module settings" },
      { status: 500 },
    );
  }
}
