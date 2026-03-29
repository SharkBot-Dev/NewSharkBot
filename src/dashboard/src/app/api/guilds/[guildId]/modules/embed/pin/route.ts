import { createPin, deletePin, fetchEmbedSettings } from "@/lib/api/requests"; // deletePinを追加
import { auth } from "@/lib/auth";
import { getValidatedChannelInServer, sendMessage } from "@/lib/Discord/Bot";
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

        const { channelId, embedId, content } = await request.json();

        if (!channelId || content === undefined || !embedId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const validatedChannel = await getValidatedChannelInServer(guildId, channelId);
        if (!validatedChannel) {
            return NextResponse.json({ error: "Invalid channelId" }, { status: 400 });
        }

        const embeds = await fetchEmbedSettings(guildId);
        const embedData = embeds.find((embed) => embed.ID === Number(embedId));

        if (!embedData) {
            return NextResponse.json({ error: "Embed not found" }, { status: 404 });
        }

        const discordMessage = await sendMessage(
            channelId,
            content, 
            embedData["data"]
        );

        if (!discordMessage?.id) {
            throw new Error("Failed to send Discord message");
        }

        const result = await createPin(guildId, {
            channel_id: channelId,
            last_message_id: discordMessage.id,
            content: content,
            embed_id: String(embedId)
        });

        if (!result) {
            return NextResponse.json({ error: "Failed to save pin setting" }, { status: 500 });
        }

        return NextResponse.json({ 
            success: true, 
            message: "Successfully created and saved.",
            data: result 
        });

    } catch (error: any) {
        console.error("Settings POST Error:", error);
        const status = error.message === "Forbidden" ? 403 : error.message === "Unauthorized" ? 401 : 500;
        return NextResponse.json({ error: error.message }, { status });
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
        const channelId = searchParams.get("channel_id");

        if (!channelId) {
            return NextResponse.json({ error: "channel_id is required" }, { status: 400 });
        }

        const success = await deletePin(guildId, channelId);
        
        if (!success) {
            return NextResponse.json({ error: "Failed to delete or record not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: "Deleted successfully" });

    } catch (error: any) {
        console.error("Settings DELETE Error:", error);
        const status = error.message === "Forbidden" ? 403 : error.message === "Unauthorized" ? 401 : 500;
        return NextResponse.json({ error: error.message }, { status });
    }
}