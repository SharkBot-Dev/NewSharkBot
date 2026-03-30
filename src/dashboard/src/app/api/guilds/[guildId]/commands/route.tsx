import { NextResponse } from "next/server";
import { commands } from "@/lib/commands";
import {
  deleteSlashCommand,
  getAllSlashCommands,
  registerSlashCommand,
  syncSlashCommands,
} from "@/lib/Discord/Bot";
import { checkAdminPermission, getAccessToken } from "@/lib/Discord/User";

import EconomyCommands from "@/constants/commands/economy"
import HelpCommands from "@/constants/commands/help"
import LevelCommands from "@/constants/commands/level"
import ModeratorCommands from "@/constants/commands/moderator"
import SearchCommands from "@/constants/commands/search"
import TestCommands from "@/constants/commands/test"
import GlobalChatCommands from "@/constants/commands/globalchat"

import { checkCooldown, fetchGuildSettings } from "@/lib/api/requests";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;
if (!BACKEND_URL) {
  throw new Error("NEXT_PUBLIC_API_URL environment variable is required");
}

const modules = {
  "economy": EconomyCommands,
  "help": HelpCommands,
  "levels": LevelCommands,
  "moderator": ModeratorCommands,
  "search": SearchCommands,
  "test": TestCommands,
  "globalchat": GlobalChatCommands
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ guildId: string }> },
) {
  const { guildId } = await params;
  
  try {
    const accessToken = await getAccessToken();
    const hasPermission = await checkAdminPermission(guildId, accessToken);
    if (!hasPermission) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } catch (e) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { action, adds = [], deletes = [] } = body as {
    action?: string;
    adds?: Array<{ name?: string }>;
    deletes?: string[];
  };

  if (action === "batch" && (!Array.isArray(adds) || !Array.isArray(deletes))) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  
  if (action === "batch") {
    try {
      const cooldown = await checkCooldown("batch_sync", guildId, 10);
      
      if (cooldown.status === "limit") {
        return NextResponse.json(
          { 
            error: "クールダウン中です。", 
            remaining: `${cooldown.remaining}秒後に再度お試しください。` 
          }, 
          { status: 429 }
        );
      }

      if (cooldown.status === "error") {
        throw new Error("クールダウンの確認に失敗しました。");
      }

      const currentCommands = await getAllSlashCommands(guildId);

      let updatedList = currentCommands.filter(
        (cmd: any) => !deletes.includes(cmd.id)
      );

      const catalog = new Map(
        Object.values(modules)
          .flat()
          .map((cmd: any) => [cmd.name, cmd]),
      );
      const validAdds = adds
        .map((cmd) => (typeof cmd?.name === "string" ? catalog.get(cmd.name) : undefined))
        .filter(Boolean) as any[];
      updatedList = [...updatedList, ...validAdds];

      const result = await syncSlashCommands(guildId, updatedList);

      return NextResponse.json({
        success: true,
        count: updatedList.length,
        data: result
      });
    } catch (error) {
      console.error("Batch sync error:", error);
      return NextResponse.json({ error: "Failed to sync commands" }, { status: 500 });
    }
  }

  if (action === "sync") {
    const settings = await fetchGuildSettings(guildId);
    if (!settings?.EnabledModules) {
      return NextResponse.json({ error: "Missing enabledModules" }, { status: 400 });
    }

    const res = await fetch(`${BACKEND_URL}/cooldowns/slash_sync/${guildId}?hours=24`, { method: 'POST' });
    if (res.status === 429) {
      const data = await res.json();
      return NextResponse.json({ error: "クールダウン中", remaining: data.remaining_hours }, { status: 429 });
    }

    const commandsToSync = Object.entries(modules)
      .filter(([key]) => settings.EnabledModules[key] === true)
      .flatMap(([_, commandArray]) => commandArray);

    const result = await syncSlashCommands(guildId, commandsToSync);
    return NextResponse.json({ success: true, syncedCount: commandsToSync.length, data: result });
  }

  if (action === "fetch") {
    const current = await getAllSlashCommands(guildId);
    return NextResponse.json(current);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}