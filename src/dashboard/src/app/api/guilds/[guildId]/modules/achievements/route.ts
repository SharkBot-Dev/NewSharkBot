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

        const listRes = await fetch(`${BACKEND_URL}/achievements/list/${guildId}`, { cache: 'no-store' });

        const settingRes = await fetch(`${BACKEND_URL}/achievements/settings/${guildId}`, { cache: 'no-store' });
        
        if (!listRes.ok || !settingRes.ok) {
            return NextResponse.json({ error: "Backend error" }, { status: 500 });
        }
        
        const list = await listRes.json();
        const settings = await settingRes.json();

        return NextResponse.json({ achievements: list, settings: settings });
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
        
        const targetPath = body.type === "setting" 
            ? `/achievements/settings/${guildId}` 
            : `/achievements/list/${guildId}`;

        const res = await fetch(`${BACKEND_URL}${targetPath}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body.data),
        });

        if (!res.ok) return NextResponse.json({ error: "Failed to save to backend" }, { status: res.status });

        const savedData = await res.json();
        return NextResponse.json({ success: true, data: savedData });
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

        const { achievement_id } = await request.json();

        if (!achievement_id) return NextResponse.json({ error: "Achievement ID is required" }, { status: 400 });

        const res = await fetch(`${BACKEND_URL}/achievements/list/${guildId}/${achievement_id}`, {
            method: "DELETE",
        });

        if (!res.ok) return NextResponse.json({ error: "Failed to delete from backend" }, { status: res.status });

        return NextResponse.json({ success: true, message: "Achievement deleted!" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}