import { NextResponse } from "next/server";
import { auth } from "@/app/auth";
import { checkAdminPermission } from "@/lib/discord";
import clientPromise from "@/lib/mongodb";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ guildId: string }> },
) {
  const { guildId } = await params;

  const { searchParams } = new URL(request.url);
  const targetModule = searchParams.get("module");

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

    let settings = (await db
      .collection("module_setting")
      .findOne({ guildId })) as any;

    if (!settings) {
      const defaultSettings = {
        guildId,
        modules: { test: false },
      };
      await db.collection("module_setting").insertOne(defaultSettings);
      settings = defaultSettings;
    }

    if (targetModule) {
      const isEnabled = !!settings.modules?.[targetModule];
      return NextResponse.json({
        module: targetModule,
        enabled: isEnabled,
      });
    }

    return NextResponse.json(settings);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to fetch module settings" },
      { status: 500 },
    );
  }
}
