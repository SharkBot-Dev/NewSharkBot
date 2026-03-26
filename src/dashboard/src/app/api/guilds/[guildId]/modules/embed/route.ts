import { auth } from "@/lib/auth";
import { checkAdminPermission } from "@/lib/Discord/User";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:8080";

/**
 * 共通の認証・権限チェック関数
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

    return discordToken;
}

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ guildId: string }> }
) {
    try {
        const { guildId } = await params;
        await validateAdmin(guildId);

        // Goサーバーから一覧を取得
        const res = await fetch(`${BACKEND_URL}/guilds/embeds/${guildId}`, {
            cache: 'no-store'
        });
        
        if (!res.ok) return NextResponse.json({ error: "Backend error" }, { status: res.status });
        
        const data = await res.json();
        return NextResponse.json({ enabled: true, settings: data });
    } catch (error: any) {
        const status = error.message === "Forbidden" ? 403 : 401;
        return NextResponse.json({ error: error.message }, { status });
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ guildId: string }> }
) {
    try {
        const { guildId } = await params;
        await validateAdmin(guildId);

        const body = await request.json();
        
        // Goサーバーへ保存リクエスト
        const res = await fetch(`${BACKEND_URL}/guilds/embeds/${guildId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: body.title, // Go側は Name フィールド
                data: body        // Dictデータとして全体を渡す
            }),
        });

        if (!res.ok) return NextResponse.json({ error: "Failed to save to backend" }, { status: res.status });

        return NextResponse.json({ success: true, message: "Settings saved!" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ guildId: string }> }
) {
    try {
        const { guildId } = await params;
        await validateAdmin(guildId);

        const body = await request.json(); // { title: "..." }

        // Goサーバーへ削除リクエスト
        const res = await fetch(`${BACKEND_URL}/guilds/embeds/${guildId}/${body.title}`, {
            method: "DELETE",
        });

        if (!res.ok) return NextResponse.json({ error: "Failed to delete from backend" }, { status: res.status });

        return NextResponse.json({ success: true, message: "Embed deleted!" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}