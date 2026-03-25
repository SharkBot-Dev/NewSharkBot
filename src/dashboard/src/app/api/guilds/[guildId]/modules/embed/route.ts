import { auth } from "@/lib/auth";
import { checkAdminPermission } from "@/lib/discord";
import clientPromise from "@/lib/mongodb";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
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
    const settings = await db.collection("embed_setting").findOne({ guildId });

    return NextResponse.json({ enabled: !!settings, settings: settings?.embeds || {} });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}


export async function POST(
  request: Request,
  { params }: { params: { guildId: string } }
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

    const client = await clientPromise;
    const db = client.db("SharkBot");

    await db
      .collection("embed_setting")
      .updateOne(
        { guildId },
        { $set: { [`embeds.${body.title}`]: body } },
        { upsert: true },
      );

    console.log(`Saving embed for guild ${guildId}:`, body);

    return NextResponse.json({ success: true, message: "Settings saved!" });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { guildId: string } }
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

    const client = await clientPromise;
    const db = client.db("SharkBot");

    await db
      .collection("embed_setting")
      .updateOne(
        { guildId },
        { $unset: { [`embeds.${body.title}`]: "" } },
      );

    console.log(`Deleting embed for guild ${guildId}:`, body.title);

    return NextResponse.json({ success: true, message: "Embed deleted!" });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}