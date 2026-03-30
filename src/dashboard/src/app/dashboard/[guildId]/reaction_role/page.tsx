import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Terminal } from "lucide-react";
import CommandsControl from "@/components/commands";
import LoadingSkeleton from "@/components/LoadingSkeleton";

import { isModuleEnabled } from "@/lib/api/requests";
import Alert from "@/components/Alert";
import { getGuildRoles } from "@/lib/Discord/Bot";
import ReactionRoleClient from "./Client";

export default async function ReactionRoleSetting({ params }: { params: { guildId: string } }) {
  const { guildId } = await params;
  try {
    const data = await isModuleEnabled(guildId, "reaction_role");

    if (!data.enabled) {
      return <Alert text="リアクションロールが有効になっていません。ダッシュボードでモジュールを有効にしてください。" redirectUrl={`/dashboard/${guildId}`} />;
    }
  } catch (error) {
    redirect(`/dashboard/${guildId}`);
  }

  return (
    <div className="min-h-screen p-6 md:p-12">
      <div className="max-w-3xl mx-auto">
        <header className="mb-10">
          <h1 className="text-3xl font-extrabold text-slate-900">リアクションロール</h1>
          <p className="mt-2 text-slate-600">
            メンバーがボタンをクリックしたり、リアクションをしたりすると<br/>
            ロールを追加・削除できるようにします。
          </p>
        </header>

        <hr className="border-slate-200 dark:border-slate-800 mb-10" />

        <Suspense fallback={<LoadingSkeleton />}>
          <ReactionRoleDataLoader guildId={guildId} />
        </Suspense>
      </div>
    </div>
  );
}

async function ReactionRoleDataLoader({ guildId }: { guildId: string }) {
    const roles = await getGuildRoles(guildId)
    return (
        <ReactionRoleClient guildId={guildId} roles={roles}></ReactionRoleClient>
    );
}