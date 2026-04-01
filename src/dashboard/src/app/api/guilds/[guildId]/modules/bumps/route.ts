import { auth } from "@/lib/auth";
import { checkAdminPermission } from "@/lib/Discord/User";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;

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

        const settingRes = await fetch(`${BACKEND_URL}/bump/${guildId}`, { 
            cache: 'no-store' 
        });

        if (settingRes.status === 404) {
            return NextResponse.json({ bots: [] });
        }

        if (!settingRes.ok) {
            return NextResponse.json({ error: "Backend error" }, { status: 500 });
        }
        
        const settings = await settingRes.json();
        return NextResponse.json(settings);

    } catch (error: any) {
        const status = error.message === "Forbidden" ? 403 : (error.message === "Unauthorized" ? 401 : 500);
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

        const payload = {
            guild_id: guildId,
            bots: body.bots || [] 
        };

        const res = await fetch(`${BACKEND_URL}/bump/${guildId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            return NextResponse.json(
                { error: errorData.error || "Failed to save to backend" }, 
                { status: res.status }
            );
        }

        const savedData = await res.json();
        return NextResponse.json({ success: true, data: savedData });

    } catch (error: any) {
        const status =
            error.message === "Forbidden" ? 403 :
            error.message === "Unauthorized" ? 401 :
            500;
        return NextResponse.json({ error: error.message }, { status });
    }
}