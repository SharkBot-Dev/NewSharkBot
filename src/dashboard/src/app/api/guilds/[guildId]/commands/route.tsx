import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
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
  let discordToken: {
    accessToken: string;
    accessTokenExpiresAt: Date | undefined;
    scopes: string[];
    idToken: string | undefined;
  };
  try {
    const allLinkedAccounts = await auth.api.listUserAccounts({
      headers: await headers(),
    });
    const discordAccountData = allLinkedAccounts.find(
      (account: any) => account.providerId === "discord",
    );
    if (!discordAccountData) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    discordToken = await auth.api.getAccessToken({
      headers: await headers(),
      body: {
        providerId: "discord",
        accountId: discordAccountData.accountId,
        userId: discordAccountData.userId,
      },
    });
  } catch (e) {
    console.log("Error fetching access token:", e);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (
    !discordToken.accessTokenExpiresAt ||
    Date.now() >= new Date(discordToken.accessTokenExpiresAt).getTime()
  ) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { action, command, commandId } = await req.json();

  if (!action || (["add", "delete"].includes(action) && !command)) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  const isAdmin = await checkAdminPermission(guildId, discordToken.accessToken);
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
  } catch (error) {
    console.log(error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Error." }, { status: 500 });
  }
}
