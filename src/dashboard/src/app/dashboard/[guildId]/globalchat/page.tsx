import { Suspense } from "react";
import { fetchEmbedSettings, isModuleEnabled } from "@/lib/api/requests"; // ラッパー関数の場所
import GlobalChatClient from "./GlobalChatClient";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import Alert from "@/components/Alert";
import { redirect } from "next/navigation";
import { getGuildChannels } from "@/lib/Discord/Bot";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { checkAdminPermission } from "@/lib/Discord/User";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;

interface Props {
  params: { guildId: string };
}

export default async function GlobalChatModule({ params }: Props) {
  const { guildId } = await params;
  try {
    const data = await isModuleEnabled(guildId, "globalchat");

    if (!data.enabled) {
      return <Alert text="グローバルチャットモジュールが有効になっていません。ダッシュボードでモジュールを有効にしてください。" redirectUrl={`/dashboard/${guildId}`} />;
    }
  } catch (error) {
    redirect(`/dashboard/${guildId}`);
  }

  return (
    <div className="min-h-screen p-6 md:p-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold text-slate-900">グローバルチャット</h1>
          <p className="mt-2 text-slate-600">複数のサーバーでチャンネルを接続することができます。</p>
        </div>

        <Suspense fallback={<LoadingSkeleton />}>
          <EmbedContent guildId={guildId} />
        </Suspense>
      </div>
    </div>
  );
}

async function validateAdmin(guildId: string) {
    const allLinkedAccounts = await auth.api.listUserAccounts({
        headers: await headers(),
    });
    const discordAccountData = allLinkedAccounts.find(
        (account) => account.providerId === "discord"
    );

    if (!discordAccountData) throw new Error("Unauthorized");

    const discordToken = await auth.api.getAccessToken({
        headers: await headers(),
        body: {
            providerId: "discord",
            accountId: discordAccountData.accountId,
            userId: discordAccountData.userId,
        },
    });

    if (!discordToken.accessToken || !discordToken.accessTokenExpiresAt || 
        Date.now() >= new Date(discordToken.accessTokenExpiresAt).getTime()) {
        throw new Error("Unauthorized");
    }

    const hasPermission = await checkAdminPermission(guildId, discordToken.accessToken);
    if (!hasPermission) throw new Error("Forbidden");

    return { token: discordToken, discordUser: discordAccountData };
}

async function EmbedContent({ guildId }: { guildId: string }) {
  const initChannels = await getGuildChannels(guildId);
  const { discordUser } = await validateAdmin(guildId);

  const res = await fetch(`${BACKEND_URL}/globalchat/guilds/${guildId}`, {
    cache: 'no-store'
  });

  let settings = [];
  if (res.ok) {
    settings = await res.json();
  }

  return (
    <GlobalChatClient 
      guildId={guildId}
      initChannels={initChannels}
      settings={settings}
      userId={discordUser.accountId}
    />
  );
}