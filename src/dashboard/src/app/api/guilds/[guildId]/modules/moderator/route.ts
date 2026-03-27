import { auth } from "@/lib/auth";
import { checkAdminPermission } from "@/lib/Discord/User";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:8080";

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

        const settingRes = await fetch(`${BACKEND_URL}/guilds/moderator/${guildId}`, {
            cache: 'no-store'
        });
        
        const automodRes = await fetch(`${BACKEND_URL}/guilds/automod/${guildId}/all`, {
            cache: 'no-store'
        });
        
        const settings = settingRes.ok ? await settingRes.json() : {};
        const automod = automodRes.ok ? await automodRes.json() : {};

        return NextResponse.json({ 
            success: true, 
            settings: settings,
            automod: automod 
        });
    } catch (error: any) {
        const status = error.message === "Forbidden" ? 403 : 401;
        return NextResponse.json({ error: error.message }, { status });
    }
}

/**
 * POST: 設定の保存
 * body.target が "basic" なら基本設定、それ以外なら AutoMod設定 (type) として保存
 */
export async function POST(
    request: Request,
    { params }: { params: Promise<{ guildId: string }> }
) {
    try {
        const { guildId } = await params;
        await validateAdmin(guildId);

        const body = await request.json();
        const { target, ...payload } = body;

        let endpoint = "";
        
        if (target === "basic") {
            endpoint = `${BACKEND_URL}/guilds/moderator/${guildId}`;
        } else {
            endpoint = `${BACKEND_URL}/guilds/automod/${guildId}/${target}`;
        }

        const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const errorData = await res.json();
            return NextResponse.json({ error: errorData.error || "Failed to save settings" }, { status: res.status });
        }

        const result = await res.json();
        return NextResponse.json({ success: true, data: result });
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

        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type"); 

        if (!type) {
            return NextResponse.json({ error: "Type is required" }, { status: 400 });
        }

        const res = await fetch(`${BACKEND_URL}/guilds/automod/${guildId}/${type}`, {
            method: "DELETE",
        });

        if (!res.ok) {
            return NextResponse.json({ error: "Failed to delete setting" }, { status: res.status });
        }

        return NextResponse.json({ success: true, message: `${type} setting deleted` });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}