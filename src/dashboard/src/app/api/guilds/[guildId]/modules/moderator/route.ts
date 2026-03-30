import { auth } from "@/lib/auth";
import { checkAdminPermission } from "@/lib/Discord/User";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;

if (!BACKEND_URL) {
  throw new Error("BACKEND_API_URL or NEXT_PUBLIC_API_URL environment variable is required");
}

const AUTOMOD_TYPES = ["invite", "badword", "badlink", "spoiler", "token", "everyone"] as const;
const isAutomodType = (value: string): value is (typeof AUTOMOD_TYPES)[number] =>
    AUTOMOD_TYPES.includes(value as (typeof AUTOMOD_TYPES)[number]);

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

        const [settingRes, automodRes] = await Promise.all([
            fetch(`${BACKEND_URL}/guilds/moderator/${guildId}`, { cache: "no-store" }),
            fetch(`${BACKEND_URL}/guilds/automod/${guildId}/all`, { cache: "no-store" }),
        ]);

        if (![settingRes, automodRes].every((res) => res.ok || res.status === 404)) {
            return NextResponse.json(
                { error: "Failed to load moderator settings" },
                { status: 502 },
            );
        }

        const settings = settingRes.status === 404 ? {} : await settingRes.json();
        const automod = automodRes.status === 404 ? {} : await automodRes.json();

        return NextResponse.json({ settings, automod });
    } catch (error: any) {
        let status = 500;
        if (error.message === "Unauthorized") status = 401;
        else if (error.message === "Forbidden") status = 403;
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status }
        );
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
        } else if (typeof target === "string" && isAutomodType(target)) {
            const type = payload.type;
            if (!type || !isAutomodType(type) || type !== target) {
                return NextResponse.json({ error: "Invalid type" }, { status: 400 });
            }
            endpoint = `${BACKEND_URL}/guilds/automod/${guildId}/${target}`;
        } else {
            return NextResponse.json({ error: "Invalid target" }, { status: 400 });
        }
        
        const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            let errorMessage = "Failed to save settings";
            try {
                const errorData = await res.json();
                errorMessage = errorData.error || errorMessage;
            } catch {
                // JSON parse failed, use default message
            }
            return NextResponse.json({ error: errorMessage }, { status: res.status })
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

        if (!type || !isAutomodType(type)) {
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