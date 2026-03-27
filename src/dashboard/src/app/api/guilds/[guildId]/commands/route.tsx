import { NextResponse } from "next/server";
import { commands } from "@/lib/commands";
import {
  deleteSlashCommand,
  getAllSlashCommands,
  registerSlashCommand,
} from "@/lib/Discord/Bot";
import { checkAdminPermission, getAccessToken } from "@/lib/Discord/User";

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
