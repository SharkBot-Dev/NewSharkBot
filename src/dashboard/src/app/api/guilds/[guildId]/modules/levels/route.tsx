import { 
    deleteLevelSetting, 
    getLevelSetting, 
    saveLevelSetting,
    getLevelRewards,
    saveLevelRewards
} from "@/lib/api/requests";
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

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ guildId: string }> }
) {
    try {
        const { guildId } = await params;
        await validateAdmin(guildId);

        const [level, rewards] = await Promise.all([
            getLevelSetting(guildId).catch(() => null),
            getLevelRewards(guildId).catch(() => [])
        ]);

        const fixedSettings = {
            guild_id: guildId,
            channel_id: level?.channel_id || "",
            content: level?.content || "",
            embed_id: level?.embed_id || null,
            reward_roles: rewards || [],
            enabled: !!level
        };

        return NextResponse.json({ success: true, settings: fixedSettings });
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

        await Promise.all([
            saveLevelSetting(guildId, body.channel_id, body.content, body.embed_id),
            body.reward_roles ? saveLevelRewards(guildId, body.reward_roles) : Promise.resolve()
        ]);

        return NextResponse.json({ success: true, message: "Settings synced successfully" });
    } catch (error: any) {
        console.error("Settings POST Error:", error);
        const status = error.message === "Forbidden" ? 403 : 401;
        return NextResponse.json({ error: error.message }, { status: status || 500 });
    }
}

export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ guildId: string }> }
) {
    try {
        const { guildId } = await params;
        await validateAdmin(guildId);

        await deleteLevelSetting(guildId);

        return NextResponse.json({ success: true, message: "Settings deleted successfully" });
    } catch (error: any) {
        console.error("Settings DELETE Error:", error);
        const status = error.message === "Forbidden" ? 403 : 401;
        return NextResponse.json({ error: error.message }, { status: status || 500 });
    }
}