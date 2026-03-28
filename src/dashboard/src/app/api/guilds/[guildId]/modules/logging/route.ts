import { fetchLoggingSetting, saveLoggingSetting, deleteLoggingSetting } from "@/lib/api/requests";
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

        const data = await fetchLoggingSetting(guildId);

        if (data && data.events) {
            data.events = data.events.map(({ webhook_url, ...rest }: any) => rest);
        }

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: error.message === "Forbidden" ? 403 : 401 }
        );
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ guildId: string }> }
) {
    try {
        const { guildId } = await params;
        await validateAdmin(guildId);

        const newSetting = await request.json();

        const currentData = await fetchLoggingSetting(guildId);
        
        if (currentData && currentData.events) {
            newSetting.events = newSetting.events.map((newEvent: any) => {
                const oldEvent = currentData.events.find(
                    (e: any) => e.event_name === newEvent.event_name
                );

                if (!oldEvent || oldEvent.log_channel_id !== newEvent.log_channel_id) {
                    return {
                        ...newEvent,
                        webhook_url: ""
                    };
                }

                return {
                    ...newEvent,
                    webhook_url: oldEvent.webhook_url 
                };
            });
        }

        const data = await saveLoggingSetting(guildId, newSetting);
        
        return NextResponse.json(data);
    } catch (error: any) {
        console.error("Failed to save logging settings:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ guildId: string }> }
) {
    try {
        const { guildId } = await params;
        await validateAdmin(guildId);

        await deleteLoggingSetting(guildId);
        return NextResponse.json({ message: "Success" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}