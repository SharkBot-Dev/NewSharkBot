import { auth } from "@/lib/auth";
import { checkAdminPermission } from "@/lib/Discord/User";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;
if (!BACKEND_URL) {
  throw new Error("NEXT_PUBLIC_API_URL environment variable is required");
}

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
                
        if (!body.name || typeof body.name !== 'string' || body.name.trim() === "") {
            return new Response(JSON.stringify({ error: "商品名は必須です。" }), { status: 400 });
        }

        const price = Number(body.price);
        if (!Number.isInteger(price) || price < 0) {
            return new Response(JSON.stringify({ error: "価格は0以上の整数で入力してください。" }), { status: 400 });
        }

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
            const errorData = await res.json().catch(() => ({}));
            return NextResponse.json({ error: errorData.error || "Failed to save item" }, { status: res.status });
        }

        const savedItem = await res.json();
        return NextResponse.json({ success: true, item: savedItem });
    } catch (error: any) {
        if (error.message === "Unauthorized") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        if (error.message === "Forbidden") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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
        if (error.message === "Unauthorized") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        if (error.message === "Forbidden") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}