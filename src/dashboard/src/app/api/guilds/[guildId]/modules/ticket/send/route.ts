import { auth } from "@/lib/auth";
import { getValidatedChannelInServer, sendMessage } from "@/lib/Discord/Bot";
import { buildActionRowsFromConfig } from "@/lib/Discord/Ticket"; 
import { checkAdminPermission } from "@/lib/Discord/User";
import { fetchEmbedSettings, saveTicketPanels } from "@/lib/api/requests";
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

    if (!discordToken.accessToken) throw new Error("Unauthorized");

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

        const { panel } = await request.json();

        if (!panel || !panel.targetChannelId) {
            return NextResponse.json({ error: "Invalid panel data" }, { status: 400 });
        }

        const validatedChannel = await getValidatedChannelInServer(guildId, panel.targetChannelId);
        if (!validatedChannel) return;

        const embedSettings = await fetchEmbedSettings(guildId);
        const components = buildActionRowsFromConfig(panel.panelButtons, panel.id);

        let embedData = null;
        if (panel.embedId) {
            const found = embedSettings.find((e) => e.ID === Number(panel.embedId));
            if (found) embedData = found.data;
        }

        const result = await sendMessage(
            panel.targetChannelId,
            panel.content || "",
            embedData,
            components
        );

        return NextResponse.json({ success: true, data: result });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}