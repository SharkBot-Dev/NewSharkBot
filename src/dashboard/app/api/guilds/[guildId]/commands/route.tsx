import { NextResponse } from "next/server";
import { auth } from "@/app/auth";
import { commands } from "@/lib/commands";
import {
  addSlashCommand,
  checkAdminPermission,
  deleteSlashCommand,
  getSlashCommands,
} from "@/lib/discord";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ guildId: string }> },
) {
  const { guildId } = await params;
  const session = await auth();

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { action, command, commandId } = await req.json();

  if (!guildId || !session?.accessToken) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  const isAdmin = await checkAdminPermission(guildId, session?.accessToken);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    switch (action) {
      case "fetch": {
        const currentCommands = await getSlashCommands(guildId);
        return NextResponse.json(currentCommands);
      }

      case "add": {
        if (!commands.includes(command.name))
          return NextResponse.json(
            { error: "Invalid command" },
            { status: 400 },
          );
        const added = await addSlashCommand(guildId, command);
        return NextResponse.json(added);
      }

      case "delete":
        await deleteSlashCommand(guildId, commandId);
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error: any) {
    console.log(error.message);
    return NextResponse.json({ error: "Error." }, { status: 500 });
  }
}
