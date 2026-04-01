import { fetchEmbedSettings } from "@/lib/api/requests";
import { auth } from "@/lib/auth";
import { getValidatedChannelInServer, sendMessage } from "@/lib/Discord/Bot";
import { checkAdminPermission } from "@/lib/Discord/User";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

async function validateAdmin(guildId: string) {
    const reqHeaders = await headers();
    const allLinkedAccounts = await auth.api.listUserAccounts({
        headers: reqHeaders,
    });
    const discordAccountData = allLinkedAccounts.find(
        (account) => account.providerId === "discord"
    );

    if (!discordAccountData) throw new Error("Unauthorized");

    const discordToken = await auth.api.getAccessToken({
        headers: reqHeaders,
        body: {
            providerId: "discord",
            accountId: discordAccountData.accountId,
            userId: discordAccountData.userId,
        },
    });

    if (!discordToken?.accessToken) throw new Error("Unauthorized");

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

        const { channelId, embed, buttons, content } = await request.json();

        if (!channelId || !buttons || !Array.isArray(buttons)) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const validatedChannel = await getValidatedChannelInServer(guildId, channelId);
        if (!validatedChannel) {
            return NextResponse.json({ error: "Invalid channelId" }, { status: 400 });
        }

        const discordComponents = [
            {
                type: 1, // ActionRow
                components: buttons.map((btn: any) => ({
                    type: 2, // Button
                    style: btn.style, 
                    label: btn.label,
                    emoji: btn.emoji ? { name: btn.emoji } : undefined,
                    custom_id: `auth:${btn.type}:${btn.roleId}`,
                })),
            },
        ];

        let embedData = undefined;

        if (embed) {
            const embeds = await fetchEmbedSettings(guildId);
            embedData = embeds.find((e) => e.ID === Number(embed));

            if (!embedData) {
                return NextResponse.json({ error: "Embed not found" }, { status: 404 });
            }
        }

        const result = await sendMessage(
            channelId,
            content, 
            embedData,
            discordComponents
        );

        return NextResponse.json({ 
            success: true, 
            message: "Authentication panel has been sent.",
            data: result 
        });
    } catch (error: any) {
        console.error("Auth Panel POST Error:", error);
        
        let status = 500;
        if (error.message === "Forbidden") status = 403;
        if (error.message === "Unauthorized") status = 401;

        return NextResponse.json({ error: error.message }, { status });
    }
}