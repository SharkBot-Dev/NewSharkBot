import { Suspense } from "react";
import { fetchEmbedSettings, getLevelRewards, getLevelSetting, isModuleEnabled } from "@/lib/api/requests";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import Alert from "@/components/Alert";
import { redirect } from "next/navigation";
import LevelsEditorClient from "./Client";
import { getGuildRoles } from "@/lib/Discord/Bot";

interface Props {
  params: { guildId: string };
}

export default async function WelcomeGoodbyeModulePage({ params }: Props) {
  const { guildId } = await params;
  try {
    const data = await isModuleEnabled(guildId, "embed");

    if (!data.enabled) {
      return <Alert text="埋め込みモジュールが有効になっていません。ダッシュボードでモジュールを有効にしてください。" redirectUrl={`/dashboard/${guildId}`} />;
    }
  } catch (error) {
    redirect(`/dashboard/${guildId}`);
  }

  return (
    <div className="min-h-screen p-6 md:p-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold text-slate-900">レベルモジュール</h1>
          <p className="mt-2 text-slate-600">Discordサーバーに魅力的なレベルシステムを導入できます。</p>
        </div>

        <Suspense fallback={<LoadingSkeleton />}>
          <LevelContent guildId={guildId} />
        </Suspense>
      </div>
    </div>
  );
}

async function LevelContent({ guildId }: { guildId: string }) {
  const initialEmbeds = await fetchEmbedSettings(guildId);
  const roles = await getGuildRoles(guildId);

  const setting = await getLevelSetting(guildId);
  const reward_roles = await getLevelRewards(guildId);

  const fixed_reward_roles = Array.from(reward_roles).map((value: any) => ({
    roleId: value.role_id,
    level: value.level
  }))

  return (
    <LevelsEditorClient 
      guildId={guildId} 
      roles={roles} 
      levelup_channel={setting.channel_id} 
      levelup_message={setting.content} 
      levelup_embed={setting.embed_id}
      reward_roles={fixed_reward_roles}
    />
  );
}