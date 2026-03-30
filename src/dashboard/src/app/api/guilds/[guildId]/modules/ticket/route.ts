import { auth } from "@/lib/auth";
import { checkAdminPermission } from "@/lib/Discord/User";
import { saveTicketPanels } from "@/lib/api/requests";
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

        const { panels } = await request.json();

        if (!panels || !Array.isArray(panels)) {
            return NextResponse.json({ error: "Invalid panels data" }, { status: 400 });
        }

        await saveTicketPanels(guildId, panels);

        return NextResponse.json({ 
            success: true, 
            message: "All panels saved and deployed to Discord." 
        });

    } catch (error: any) {
        console.error("Ticket Settings POST Error:", error);
        
        let status = 500;
        if (error.message === "Forbidden") status = 403;
        if (error.message === "Unauthorized") status = 401;

        return NextResponse.json({ error: error.message }, { status });
    }
}