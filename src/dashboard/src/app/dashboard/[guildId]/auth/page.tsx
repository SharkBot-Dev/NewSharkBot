import { Suspense } from "react";
import { isModuleEnabled } from "@/lib/api/requests";
import AuthClient from "./Client";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import Alert from "@/components/Alert";
import { redirect } from "next/navigation";
import { getGuildChannels, getGuildRoles } from "@/lib/Discord/Bot";

interface Props {
  params: Promise<{ guildId: string }>;
}

export default async function AuthPageSetting({ params }: Props) {
  const { guildId } = await params;
  
  try {
    const data = await isModuleEnabled(guildId, "auth");

    if (!data.enabled) {
      return (
        <Alert 
          text="認証モジュールが有効になっていません。ダッシュボードでモジュールを有効にしてください。" 
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
          <h1 className="text-3xl font-extrabold text-black">認証モジュール</h1>
          <p className="mt-2 text-slate-400">
            メンバーをロボットではないことを確認します。
          </p>
        </div>

        <Suspense fallback={<LoadingSkeleton />}>
          <AuthLoader guildId={guildId} />
        </Suspense>
      </div>
    </div>
  );
}

async function AuthLoader({ guildId }: { guildId: string }) {
  const [roles, channels] = await Promise.all([
    getGuildRoles(guildId),
    getGuildChannels(guildId),
  ]);

  const safeRoles = roles || [];
  const safeChannels = channels || [];

  return (
    <AuthClient 
      guildId={guildId} 
      channels={safeChannels}
      roles={safeRoles}
    />
  );
}