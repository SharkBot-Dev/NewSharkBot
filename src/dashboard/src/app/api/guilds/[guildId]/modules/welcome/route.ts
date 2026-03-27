import { deleteMessageSetting, fetchMessageSetting, saveMessageSetting } from "@/lib/api/requests";
import { auth } from "@/lib/auth";
import { checkAdminPermission } from "@/lib/Discord/User";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

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

/**
 * GET: GoサーバーからWelcomeとGoodbyeの設定を取得して整形
 */
export async function GET(
    _request: Request,
    { params }: { params: Promise<{ guildId: string }> }
) {
    try {
        const { guildId } = await params;
        await validateAdmin(guildId);

        const welcome = await fetchMessageSetting(guildId, "welcome");

        const fixedSettings = {
            channel_id: welcome?.channel_id || "",
            content: welcome?.content || "",
            embed_id: welcome?.embed_id || null,
            enabled: !!welcome
        };

        return NextResponse.json({ success: true, settings: fixedSettings });
    } catch (error: any) {
        const status = error.message === "Forbidden" ? 403 : 401;
        return NextResponse.json({ error: error.message }, { status });
    }
}

/**
 * POST: フロントからのリクエストをGoサーバーへ転送
 */

export async function POST(
    request: Request,
    { params }: { params: Promise<{ guildId: string }> }
) {
    try {
        const { guildId } = await params;
        await validateAdmin(guildId);

        const body = await request.json();

        await saveMessageSetting(guildId, "welcome", body.welcome);

        return NextResponse.json({ success: true, message: "Settings synced successfully" });
    } catch (error: any) {
        console.error("Settings POST Error:", error);
        const status = error.message === "Forbidden" ? 403 : 401;
        return NextResponse.json({ error: error.message }, { status: status || 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ guildId: string }> }
) {
    try {
        const { guildId } = await params;
        await validateAdmin(guildId);

        await deleteMessageSetting(guildId, "welcome");

        return NextResponse.json({ success: true, message: "Settings synced successfully" });
    } catch (error: any) {
        console.error("Settings POST Error:", error);
        const status = error.message === "Forbidden" ? 403 : 401;
        return NextResponse.json({ error: error.message }, { status: status || 500 });
    }
}