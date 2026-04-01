import { Suspense } from "react";
import { isModuleEnabled } from "@/lib/api/requests";
import BumpClient from "./BumpClient";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import Alert from "@/components/Alert";
import { redirect } from "next/navigation";
import { getGuildChannels, getGuildRoles } from "@/lib/Discord/Bot";

interface Props {
  params: Promise<{ guildId: string }>;
}

export default async function BumpPage({ params }: Props) {
  const { guildId } = await params;
  
  try {
    const data = await isModuleEnabled(guildId, "bump");

    if (!data.enabled) {
      return (
        <Alert 
          text="Bump通知モジュールが有効になっていません。ダッシュボードでモジュールを有効にしてください。" 
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
          <h1 className="text-3xl font-extrabold text-black">Bump通知モジュール</h1>
          <p className="mt-2 text-slate-400">
            DisboardなどのBotで/bumpを実行できるようになったらお知らせします。
          </p>
        </div>

        <Suspense fallback={<LoadingSkeleton />}>
          <BumpLoader guildId={guildId} />
        </Suspense>
      </div>
    </div>
  );
}

async function safeFetch(guildId: string) {
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;
  
  try {
    const settingRes = await fetch(`${BACKEND_URL}/bump/${guildId}`, { 
      cache: 'no-store' 
    });

    if (settingRes.status === 404) {
      return { bots: [] };
    }

    if (!settingRes.ok) {
      throw new Error("Failed to fetch settings");
    }

    const data = await settingRes.json();
    
    return {
      bots: data.bots || []
    };

  } catch (error) {
    console.error("Bump settings fetch error:", error);
    throw error;
  }
}

async function BumpLoader({ guildId }: { guildId: string }) {
  const [roles, channels, initSettings] = await Promise.all([
    getGuildRoles(guildId),
    getGuildChannels(guildId),
    safeFetch(guildId),
  ]);

  const safeRoles = roles || [];
  const safeChannels = channels || [];
  const safeSettings = initSettings || { bots: [] };

  return (
    <BumpClient 
      guildId={guildId} 
      channels={safeChannels}
      roles={safeRoles}
      initSettings={safeSettings}
    />
  );
}