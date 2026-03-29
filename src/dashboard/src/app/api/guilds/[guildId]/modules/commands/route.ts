import { getCommandPrefix, getCommands } from "@/lib/api/requests";
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

        const [commands, prefixes] = await Promise.all([
            getCommands(guildId),
            getCommandPrefix(guildId)
        ]);

        return NextResponse.json({ 
            success: true, 
            commands: commands,
            prefixes: prefixes 
        });
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
        const { prefixes, commands } = body;

        const prefixRes = await fetch(`${BACKEND_URL}/commands/${guildId}/prefixs`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prefixes: prefixes }),
        });

        if (!prefixRes.ok) throw new Error("Failed to update prefixes");

        const fixed_commands = commands.map((command: any) => ({
            ...command,
            guild_id: guildId 
        }));

        const commandRes = await fetch(`${BACKEND_URL}/commands/${guildId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(fixed_commands),
        });

        if (!commandRes.ok) throw new Error("Failed to update commands");

        return NextResponse.json({ 
            success: true, 
            message: "Settings saved successfully" 
        });

    } catch (error: any) {
        console.error("Save Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}