import { NextResponse } from "next/server";
import { RESOURCE_API_BASE_URL } from "@/constants/api/endpoints";
import { parseResponse } from "@/lib/api/parsers";
import { checkAdminPermission, getAccessToken } from "@/lib/Discord/User";
import type { GuildSettings } from "@/types/api/GuildSettings";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ guildId: string }> },
) {
  const { guildId } = await params;

  const { searchParams } = new URL(request.url);
  const targetModule = searchParams.get("module");

  try {
    const accessToken = await getAccessToken();
    const hasPermission = await checkAdminPermission(guildId, accessToken);

    if (!hasPermission) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to fetch access token" },
      { status: 401 },
    );
  }

  try {
    const response = await fetch(`${RESOURCE_API_BASE_URL}/guilds/${guildId}`);

    if (response.status === 404) {
      const defaultSettings = {
        guildId,
        enabledModules: { test: false },
      };
      return NextResponse.json(defaultSettings);
    }
    if (!response.ok) {
      console.error(`Failed to fetch guild settings: ${response.statusText}`);
      return NextResponse.json(
        { error: "Failed to fetch guild settings" },
        { status: 500 },
      );
    }

    const settings = parseResponse<GuildSettings>(await response.json());

    if (targetModule) {
      const isEnabled = !!settings.enabledModules?.[targetModule];
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
