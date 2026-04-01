import { auth } from "@/lib/auth";
import { checkAdminPermission } from "@/lib/Discord/User";
import { getAuthBlockGuilds, updateAuthBlockGuilds } from "@/lib/api/requests";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

async function validateAdmin(guildId: string) {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session) throw new Error("Unauthorized");

    const allLinkedAccounts = await auth.api.listUserAccounts({ headers: reqHeaders });
    const discordAccount = allLinkedAccounts.find(a => a.providerId === "discord");
    if (!discordAccount) throw new Error("Unauthorized");

    const token = await auth.api.getAccessToken({
        headers: reqHeaders,
        body: { providerId: "discord", accountId: discordAccount.accountId, userId: discordAccount.userId },
    });

    if (!token?.accessToken) throw new Error("Unauthorized");

    const hasPermission = await checkAdminPermission(guildId, token.accessToken);
    if (!hasPermission) throw new Error("Forbidden");

    return true;
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ guildId: string }> }
) {
    try {
        const { guildId } = await params;
        await validateAdmin(guildId);

        const data = await getAuthBlockGuilds(guildId);
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: error.message === "Forbidden" ? 403 : 401 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ guildId: string }> }
) {
    try {
        const { guildId } = await params;
        await validateAdmin(guildId);

        const { blockd_guilds } = await request.json();
        if (
            !Array.isArray(blockd_guilds) ||
            !blockd_guilds.every((id): id is string => typeof id === "string" && /^\d{17,20}$/.test(id))
        ) {
            return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
        }

        const result = await updateAuthBlockGuilds(guildId, blockd_guilds);
        return NextResponse.json(result);
    } catch (error: any) {
        if (error instanceof SyntaxError) {
            return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
        }
        if (error?.message === "Forbidden") {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }
        if (error?.message === "Unauthorized") {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }
        return NextResponse.json(
            { error: error?.message ?? "Internal Server Error" },
            { status: 500 }
        );
     }
}