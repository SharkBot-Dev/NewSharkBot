import { auth } from "@/lib/auth";
import { checkAdminPermission } from "@/lib/Discord/User";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:8080";

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

        const body = await request.json();
        
        const res = await fetch(`${BACKEND_URL}/guilds/economy/${guildId}/items`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: body.name,
                price: Number(body.price),
                type: body.type,
                role_id: body.role_id || "",
                auto_use: !!body.auto_use,
                can_buy: body.can_buy !== undefined ? body.can_buy : true,
                can_buy_multiple: body.can_buy_multiple !== undefined ? body.can_buy_multiple : true,
            }),
        });

        if (!res.ok) {
            const errorData = await res.json();
            return NextResponse.json({ error: errorData.error || "Failed to save item" }, { status: res.status });
        }

        const savedItem = await res.json();
        return NextResponse.json({ success: true, item: savedItem });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
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
        let itemId = searchParams.get("item_id");

        if (!itemId) {
            const body = await request.json().catch(() => ({}));
            itemId = body.item_id;
        }

        if (!itemId || !/^\d+$/.test(itemId)) {
            return NextResponse.json({ error: "Invalid item ID" }, { status: 400 });
        }

        const res = await fetch(`${BACKEND_URL}/guilds/economy/${guildId}/items/${itemId}`, {
            method: "DELETE",
        });

        if (!res.ok) {
            return NextResponse.json({ error: "Failed to delete item from backend" }, { status: res.status });
        }

        return NextResponse.json({ success: true, message: "Item deleted successfully" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}