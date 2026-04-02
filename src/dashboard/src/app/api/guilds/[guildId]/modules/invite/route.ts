import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkAdminPermission } from "@/lib/Discord/User";
import { headers } from "next/headers";
import { saveInviteSetting } from "@/lib/api/requests";

async function validateAdmin(guildId: string) {
    const allLinkedAccounts = await auth.api.listUserAccounts({
        headers: await headers(),
    });
    const discordAccountData = allLinkedAccounts.find(
        (account) => account.providerId === "discord"
    );

    if (!discordAccountData) throw new Error("Unauthorized");

    const discordToken = await auth.api.getAccessToken({
        headers: await headers(),
        body: {
            providerId: "discord",
            accountId: discordAccountData.accountId,
            userId: discordAccountData.userId,
        },
    });

    if (!discordToken.accessToken || !discordToken.accessTokenExpiresAt || 
        Date.now() >= new Date(discordToken.accessTokenExpiresAt).getTime()) {
        throw new Error("Unauthorized");
    }

    const hasPermission = await checkAdminPermission(guildId, discordToken.accessToken);
    if (!hasPermission) throw new Error("Forbidden");

    return { token: discordToken, discordUser: discordAccountData };
}


export async function POST(req: NextRequest) {

    
  try {
    const { guildId, channelId, content, embed_id } = await req.json();

    try {
        await validateAdmin(guildId);
    } catch (error) {
        if (error instanceof Error && error.message === "Unauthorized") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        if (error instanceof Error && error.message === "Forbidden") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        throw error;
    }
    
    const safeGuildId = encodeURIComponent(guildId);
    const data = await saveInviteSetting(safeGuildId, channelId, content, embed_id)

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}