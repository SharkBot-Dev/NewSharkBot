import { NextResponse } from "next/server";
import { auth } from "@/app/auth";
import { checkAdminPermission } from "@/lib/discord";
import clientPromise from "@/lib/mongodb";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ guildId: string }> },
) {
  const { guildId } = await params;
  const session = await auth();

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hasPermission = await checkAdminPermission(
    guildId,
    session.accessToken,
  );
  if (!hasPermission) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const client = await clientPromise;
    const db = client.db("SharkBot");

    let settings = await db.collection("module_setting").findOne({ guildId });

    if (!settings) {
      settings = {
        guildId,
        modules: { test: false },
      } as any;
      await db.collection("module_setting").insertOne(settings as any);
    }

    return NextResponse.json(settings);
  } catch {
    return NextResponse.json({ error: "DB接続エラー" }, { status: 500 });
  }
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ guildId: string }> },
) {
  const { guildId } = await params;
  const session = await auth();

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hasPermission = await checkAdminPermission(
    guildId,
    session.accessToken,
  );
  if (!hasPermission) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { moduleId, enabled } = await request.json();

  try {
    const client = await clientPromise;
    const db = client.db("SharkBot");

    await db
      .collection("module_setting")
      .updateOne(
        { guildId },
        { $set: { [`modules.${moduleId}`]: enabled } },
        { upsert: true },
      );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to update module settings" },
      { status: 500 },
    );
  }
}
