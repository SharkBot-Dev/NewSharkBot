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
import { fetchGuildSettings } from "@/lib/api/requests";

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
  "test": TestCommands
}

export async function POST(
  req: Request,
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

  const { action, command, commandId } = await req.json();

  if (action == "sync") {
    const settings = await fetchGuildSettings(guildId);
    if (!settings) {
      return NextResponse.json({ error: "EnabledModule NotFound" }, { status: 404 });
    }
    const enabledModules = settings.EnabledModules;

    if (!enabledModules) {
      return NextResponse.json({ error: "Missing enabledModules" }, { status: 400 });
    }

    const res = await fetch(`${BACKEND_URL}/cooldowns/slash_sync/${guildId}?hours=24`, { method: 'POST' });
    if (res.status === 429) {
      const data = await res.json();
      return NextResponse.json(
        { 
          error: "クールダウン中です。", 
          remaining: `${data.remaining_hours}時間後に再度お試しください。` 
        }, 
        { status: 429 }
      );
    }

    if (!res.ok) {
      return NextResponse.json(
        { error: "クールダウンの保存に失敗しました。" }, 
        { status: 500 }
      );
    }

    const commandsToSync = Object.entries(modules)
      .filter(([key]) => enabledModules[key] === true)
      .flatMap(([_, commandArray]) => commandArray);

    const result = await syncSlashCommands(guildId, commandsToSync);
        
    return NextResponse.json({ 
      success: true, 
      syncedCount: commandsToSync.length,
      data: result 
    });
  }

  if (!action || action == "add" && !command) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  try {
    switch (action) {
      case "fetch": {
        const currentCommands = await getAllSlashCommands(guildId);
        return NextResponse.json(currentCommands);
      }

      case "add": {
        if (!commands.includes(command.name))
          return NextResponse.json(
            { error: "Invalid command" },
            { status: 400 },
          );
        const added = await registerSlashCommand(guildId, command);
        return NextResponse.json(added);
      }

      case "delete":
        await deleteSlashCommand(guildId, commandId);
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.log(error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Error." }, { status: 500 });
  }
}
