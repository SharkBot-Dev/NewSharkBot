import { NextResponse } from "next/server";
import { RESOURCE_API_BASE_URL } from "@/constants/api/endpoints";
import { parseResponse, serializeRequest } from "@/lib/api/parsers";
import { checkAdminPermission, getAccessToken } from "@/lib/Discord/User";
import type { GuildSettings } from "@/types/api/GuildSettings";

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

    return NextResponse.json(settings);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch module settings" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ guildId: string }> },
) {
  const { guildId } = await params;

  let moduleId: string, enabled: boolean;
  try {
    const accessToken = await getAccessToken();

    const hasPermission = await checkAdminPermission(guildId, accessToken);
    if (!hasPermission) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    ({ moduleId, enabled } = await request.json());
  } catch (e) {
    console.log("Error fetching access token or checking permissions:", e);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const response = await fetch(
      `${RESOURCE_API_BASE_URL}/guilds/${guildId}/modules`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          serializeRequest({ enabledModules: { [moduleId]: enabled } }),
        ),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.log("Error response from API:", errorData);
      return NextResponse.json(
        { error: "Failed to update module settings" },
        { status: response.status },
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to update module settings" },
      { status: 500 },
    );
  }
}
