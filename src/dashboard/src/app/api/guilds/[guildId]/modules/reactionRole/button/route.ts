import { deleteMessageSetting, fetchEmbedSettings, fetchMessageSetting, saveMessageSetting } from "@/lib/api/requests";
import { auth } from "@/lib/auth";
import { sendMessage } from "@/lib/Discord/Bot";
import { buildActionRowsFromMap } from "@/lib/Discord/RolePanel";
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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ guildId: string }> }
) {
    try {
        const { guildId } = await params;

        await validateAdmin(guildId);

        const { channelId, content, embedId, roles } = await request.json();

        if (!channelId || !roles) {
            return NextResponse.json({ error: "Missing channelId or roles" }, { status: 400 });
        }

        const components = buildActionRowsFromMap(roles);
        
        if (embedId) {
            const embeds = await fetchEmbedSettings(guildId);
            const embedData = embeds.find((embed) => embed.ID === Number(embedId));

            if (!embedData) {
                return NextResponse.json({ error: "Embed not found" }, { status: 404 });
            }

            const result = await sendMessage(
                channelId,
                content || "", 
                embedData["data"], 
                components
            );

            return NextResponse.json({ 
                success: true, 
                message: "Sent.",
                data: result 
            });
        } else {
            const result = await sendMessage(
                channelId,
                content || "", 
                null, 
                components
            );

            return NextResponse.json({ 
                success: true, 
                message: "Sent.",
                data: result 
            });
        }

    } catch (error: any) {
        console.error("Settings POST Error:", error);
        
        let status = 500;
        if (error.message === "Forbidden") status = 403;
        if (error.message === "Unauthorized") status = 401;
        if (error.message === "Invalid Channel ID") status = 400;

        return NextResponse.json({ error: error.message }, { status });
    }
}