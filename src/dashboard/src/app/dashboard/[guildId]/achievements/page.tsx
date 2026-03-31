import { Suspense } from "react";
import { getAchievementList, getAchievementSettings, isModuleEnabled } from "@/lib/api/requests";
import AchievementsClient from "./Client";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import Alert from "@/components/Alert";
import { redirect } from "next/navigation";
import { getGuildChannels, getGuildRoles } from "@/lib/Discord/Bot";

interface Props {
  params: Promise<{ guildId: string }>;
}

export default async function AchievementsPage({ params }: Props) {
  const { guildId } = await params;
  
  try {
    const data = await isModuleEnabled(guildId, "achievements");

    if (!data.enabled) {
      return (
        <Alert 
          text="実績モジュールが有効になっていません。ダッシュボードでモジュールを有効にしてください。" 
          redirectUrl={`/dashboard/${guildId}`} 
        />
      );
    }
  } catch (error) {
    redirect(`/dashboard/${guildId}`);
  }

  return (
    <div className="min-h-screen p-6 md:p-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold text-black">実績モジュール</h1>
          <p className="mt-2 text-slate-400">
            サーバー内の活動に応じて、メンバーに実績とロール報酬を自動付与します。
          </p>
        </div>

        <Suspense fallback={<LoadingSkeleton />}>
          <AchievementsLoader guildId={guildId} />
        </Suspense>
      </div>
    </div>
  );
}

async function safeFetch(guildId: string) {
    try {
        const data = await getAchievementSettings(guildId);
        const achievements = await getAchievementList(guildId);
        if (!data || !achievements) throw new Error("No data");
        return {
            achievements: achievements,
            settings: data
        };
    } catch (error) {
        return {
            achievements: [],
            settings: {
                guild_id: guildId,
                notify_channel_id: "",
                is_notify_enabled: true,
                content: "🎉 {ユーザー名}が実績【{実績名}（{ステップ名}）】を達成しました！",
                embed_id: ""
            }
        };
    }
}

async function AchievementsLoader({ guildId }: { guildId: string }) {
  const [roles, channels, initSettings] = await Promise.all([
    getGuildRoles(guildId),
    getGuildChannels(guildId),
    safeFetch(guildId),
  ]);

  const safeRoles = roles || [];
  const safeChannels = channels || [];

  return (
    <AchievementsClient 
      guildId={guildId} 
      channels={safeChannels}
      roles={safeRoles}
      initSettings={initSettings}
    />
  );
}