import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { auth } from "@/app/auth";

import { checkAdminPermission, getGuildRequest } from "@/lib/discord"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ guildId: string }> }
) {
  const { guildId } = await params;
  const session = await auth();

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hasPermission = await checkAdminPermission(guildId, session.accessToken);
  if (!hasPermission) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const guild = await getGuildRequest(guildId);

    if (!guild?.id) {
      return NextResponse.json({ error: "Guild not found" }, { status: 404 });
    }

    return NextResponse.json(guild);
  } catch (e) {
    return NextResponse.json({ error: "エラー" }, { status: 500 });
  }
}