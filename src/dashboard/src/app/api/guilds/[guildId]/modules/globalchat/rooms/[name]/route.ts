import { getGlobalChatRole } from "@/lib/api/requests";
import { auth } from "@/lib/auth";
import { checkAdminPermission } from "@/lib/Discord/User";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;

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
 * GET: ルーム設定を取得
 */
export async function GET(
    _request: Request,
    { params }: { params: Promise<{ guildId: string, name: string }> }
) {
    try {
        const { name } = await params;

        const res = await fetch(`${BACKEND_URL}/globalchat/rooms/${encodeURIComponent(name)}`, {
            cache: 'no-store'
        });
        
        if (!res.ok) return NextResponse.json({ error: "Backend error" }, { status: res.status });

        const data = await res.json();

        if (data.connections && Array.isArray(data.connections)) {
            data.connections = data.connections.map(({ webhook_url, ...rest }: any) => rest);
        }

        return NextResponse.json(data);
    } catch (error: any) {
        const status = error.message === "Forbidden" ? 403 : 401;
        return NextResponse.json({ error: error.message }, { status });
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ guildId: string, name: string }> }
) {
    try {
        const { guildId, name } = await params;
        const { discordUser } = await validateAdmin(guildId);

        try {
            const role = await getGlobalChatRole(name, discordUser.accountId);

            if (role.role !== "owner") return NextResponse.json({ error: "Forbidden" }, { status: 403 });;
        } catch {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const { description, rule, slowmode, min_account_age } = body;

        const res = await fetch(`${BACKEND_URL}/globalchat/rooms`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                rule: rule,
                description: description,
                slowmode: slowmode,
                min_account_age: min_account_age,
                name: name,
            }),
        });

        if (!res.ok) return NextResponse.json({ error: "Failed to connect" }, { status: res.status });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}