import { NextResponse } from "next/server";
import { checkAdminPermission, getAccessToken } from "@/lib/Discord/User";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ guildId: string }> },
) {
  const { guildId } = await params;
  try {
    const accessToken = await getAccessToken();

    const hasPermission = await checkAdminPermission(guildId, accessToken);
    if (!hasPermission) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } catch (e) {
    console.log("Error fetching access token or checking permissions:", e);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    /* TODO: Impliment DB connection and fetching module settings
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
    */
    const settings = {
      guildId,
      modules: { test: false },
    };

    return NextResponse.json(settings);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch module settings" },
      { status: 500 },
    );
  }
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ guildId: string }> },
) {
  const { guildId } = await params;

  try {
    const accessToken = await getAccessToken();

    const hasPermission = await checkAdminPermission(guildId, accessToken);
    if (!hasPermission) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } catch (e) {
    console.log("Error fetching access token or checking permissions:", e);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // const { moduleId, enabled } = await request.json();

  try {
    /* TODO: Impliment DB connection and updating module settings
    const client = await clientPromise;
    const db = client.db("SharkBot");

    await db
      .collection("module_setting")
      .updateOne(
        { guildId },
        { $set: { [`modules.${moduleId}`]: enabled } },
        { upsert: true },
      );
    */

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to update module settings" },
      { status: 500 },
    );
  }
}
