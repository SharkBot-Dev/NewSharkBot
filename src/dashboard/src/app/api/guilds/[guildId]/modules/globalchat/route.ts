import { auth } from "@/lib/auth";
import { getValidatedChannelInServer } from "@/lib/Discord/Bot";
import { checkAdminPermission } from "@/lib/Discord/User";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;

function toErrorResponse(error: unknown) {
    const message =
        error instanceof Error ? error.message : "Internal Server Error";
    const status =
        message === "Unauthorized" ? 401 :
        message === "Forbidden" ? 403 :
        500;

    return NextResponse.json(
        { error: status === 500 ? "Internal Server Error" : message },
        { status }
    );
}

/**
 * 共通の認証・権限チェック
 */
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

/**
 * GET: ギルドの接続状況一覧を取得
 */
export async function GET(
    _request: Request,
    { params }: { params: Promise<{ guildId: string }> }
) {
    try {
        const { guildId } = await params;
        await validateAdmin(guildId);

        const res = await fetch(`${BACKEND_URL}/globalchat/guilds/${guildId}`, {
            cache: 'no-store'
        });
        
        if (!res.ok) return NextResponse.json({ error: "Backend error" }, { status: res.status });
        
        const data = await res.json();
        return NextResponse.json(data);
    } catch (error: any) {
        return toErrorResponse(error);
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ guildId: string }> }
) {
    try {
        const { guildId } = await params;
        const { discordUser } = await validateAdmin(guildId); 

        const body = await request.json();
        const { channel_id, room_name } = body;

        try {
            const check = await getValidatedChannelInServer(guildId, channel_id);
        } catch {
            return NextResponse.json({ error: "Not Found" }, { status: 404 });
        }

        const res = await fetch(`${BACKEND_URL}/globalchat/connect`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                channel_id: channel_id,
                guild_id: guildId,
                name: room_name,
                webhook_url: "", 
                creator_id: discordUser.accountId
            }),
        });

        if (!res.ok) return NextResponse.json({ error: "Failed to connect" }, { status: res.status });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return toErrorResponse(error);
    }
}

/**
 * DELETE: チャンネルの接続を解除
 */
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ guildId: string }> }
) {
    try {
        const { guildId } = await params;
        await validateAdmin(guildId);

        const body = await request.json();

        if (!body.channel_id) return NextResponse.json({ error: "Channel ID required" }, { status: 400 });

        const res = await fetch(`${BACKEND_URL}/globalchat/connect/${body.channel_id}`, {
            method: "DELETE",
        });

        if (!res.ok) return NextResponse.json({ error: "Failed to disconnect" }, { status: res.status });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return toErrorResponse(error);
    }
}