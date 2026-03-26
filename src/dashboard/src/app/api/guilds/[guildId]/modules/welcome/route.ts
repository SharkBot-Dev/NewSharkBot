import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkAdminPermission } from "@/lib/discord";
import clientPromise from "@/lib/mongodb";

interface WelcomeSetting {
  guildId: string;
  welcome: {
    channelId: string;
    message: string;
    embed: any;
    enabled: boolean;
  },
  goodbye: {
    channelId: string;
    message: string;
    embed: any;
    enabled: boolean;
  };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ guildId: string }> },
) {
  try {
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

    const client = await clientPromise;
    const db = client.db("SharkBot");
    const settings = await db.collection("welcome_setting").findOne({ guildId });

    const fixedSettings = {
      welcome: {
        channelId: settings?.welcome?.channelId || "",
        message: settings?.welcome?.message || "",
        embed: settings?.welcome?.embed || null,
        enabled: settings?.welcome?.enabled || false,
      },
      goodbye: {
        channelId: settings?.goodbye?.channelId || "",
        message: settings?.goodbye?.message || "",
        embed: settings?.goodbye?.embed || null,
        enabled: settings?.goodbye?.enabled || false,
      },
    };
    return NextResponse.json({ success: true, settings: fixedSettings });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { guildId: string } },
) {
  try {
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

    const body = await request.json();
    const settung: WelcomeSetting = {
        guildId,
        ...body
    };

    const client = await clientPromise;
    const db = client.db("SharkBot");
    await db.collection("welcome_setting").updateOne(
        { guildId },
        { $set: { ...settung } },
        { upsert: true },
    )

    return NextResponse.json({ success: true, message: "Settings saved!" });

  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}