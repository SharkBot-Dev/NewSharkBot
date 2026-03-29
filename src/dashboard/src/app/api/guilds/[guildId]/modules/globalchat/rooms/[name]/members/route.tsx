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

// BAN (POST)
export async function POST(
    request: Request,
    { params }: { params: Promise<{ guildId: string, name: string }> }
) {
    try {
        const { guildId, name } = await params;
        const { discordUser } = await validateAdmin(guildId);

        // 権限チェック
        try {
            const role = await getGlobalChatRole(name, discordUser.accountId);
            if (role.role !== "owner") {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
        } catch {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const { userId, reason } = body; 

        // Goバックエンドの banMembers は []string を待っているので配列にする
        const res = await fetch(`${BACKEND_URL}/globalchat/rooms/${encodeURIComponent(name)}/ban/members`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                user_ids: Array.isArray(userId) ? userId : [userId],
                reason: reason || "No reason provided"
            })
        });

        if (!res.ok) {
            const errorData = await res.json();
            return NextResponse.json({ error: errorData.error || "Failed to ban" }, { status: res.status });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// UNBAN (DELETE)
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ guildId: string, name: string }> }
) {
    try {
        const { guildId, name } = await params;
        const { discordUser } = await validateAdmin(guildId);

        // 権限チェック
        try {
            const role = await getGlobalChatRole(name, discordUser.accountId);
            if (role.role !== "owner") {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
        } catch {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        let { userId } = await request.json()

        if (!userId) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        // バックエンドのパス: /rooms/:name/ban/members/:user_id
        const res = await fetch(`${BACKEND_URL}/globalchat/rooms/${encodeURIComponent(name)}/ban/members/${userId}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" }
        });

        if (!res.ok) {
            return NextResponse.json({ error: "Failed to unban" }, { status: res.status });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}