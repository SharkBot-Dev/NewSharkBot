import { Suspense } from "react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getAuthBlockGuilds, getAuthCode, deleteAuthCode } from "@/lib/api/requests";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import { getUsersGuilds } from "@/lib/Discord/User";
import { addRoleToMember } from "@/lib/Discord/Bot";
import { SignIn } from "@/components/login-button";

export default async function AuthPage({ 
    params, 
    searchParams 
}: { 
    params: Promise<{ guildId: string }>,
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const { guildId } = await params;
    const { code } = await searchParams;
    const reqHeaders = await headers();

    const session = await auth.api.getSession({
        headers: reqHeaders,
    });

    if (!session) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-white text-black">
                <div className="max-w-md w-full bg-card p-8 rounded-xl shadow-lg border text-center">
                    <h1 className="text-xl font-bold mb-4">ログインが必要です。</h1>
                    <div className="flex justify-center">
                        <SignIn />
                    </div>
                </div>
            </div>
        );
    }

    const allLinkedAccounts = await auth.api.listUserAccounts({
        headers: reqHeaders,
    });
    
    const discordAccountData = allLinkedAccounts.find(
        (account) => account.providerId === "discord"
    );

    if (!discordAccountData) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-white text-black">
                <div className="max-w-md w-full bg-card p-8 rounded-xl shadow-lg border text-center">
                    <h1 className="text-xl font-bold mb-4">Discord連携が必要です</h1>
                    <p className="text-muted-foreground mb-6">
                        アカウント設定からDiscordを連携してから再度お試しください。
                    </p>
                </div>
            </div>
        );
    }

    const discordToken = await auth.api.getAccessToken({
        headers: reqHeaders,
        body: {
            providerId: "discord",
            accountId: discordAccountData.accountId,
            userId: discordAccountData.userId,
        },
    });

    if (!discordToken?.accessToken) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 text-center">
                <p className="text-destructive">トークンの取得に失敗しました。再ログインしてください。</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-white text-black">
            <div className="max-w-md w-full bg-card p-8 rounded-xl shadow-lg border">
                <Suspense fallback={<LoadingSkeleton />}>
                    <AuthLogic 
                        userId={discordAccountData.accountId} 
                        guildId={guildId} 
                        accessToken={discordToken.accessToken}
                        code={(code as string) || ""}
                    />
                </Suspense>
            </div>
        </div>
    );
}

async function AuthLogic({ userId, guildId, accessToken, code }: { userId: string, guildId: string, accessToken: string, code: string }) {
    try {
        if (!code) throw new Error("認証コードが提供されていません。");

        const blockSettings = await getAuthBlockGuilds(guildId);
        
        const userGuilds = await getUsersGuilds(accessToken);
        const userGuildIds = userGuilds.map((g: any) => g.id);

        const isBlocked = blockSettings.blockd_guilds.some((id: string) => 
            userGuildIds.includes(id)
        );

        if (isBlocked) {
            return (
                <div className="text-center">
                    <div className="text-5xl mb-4">🚫</div>
                    <h1 className="text-2xl font-bold text-destructive mb-4">認証に失敗しました</h1>
                    <p className="text-muted-foreground">
                        参加中のサーバーに禁止コミュニティが含まれています。対象サーバーを脱退後、再度お試しください。
                    </p>
                </div>
            );
        }

        const authData = await getAuthCode(guildId, code);

        await deleteAuthCode(guildId, code);

        await addRoleToMember(guildId, userId, authData.role_id);

        return (
            <div className="text-center animate-in fade-in zoom-in duration-300 bg-white text-black">
                <div className="text-5xl mb-4">✅</div>
                <h1 className="text-2xl font-bold text-primary mb-2">認証が完了しました！</h1>
                <p className="text-muted-foreground">
                    Discordのロールが付与されました。このタブを閉じても大丈夫です。
                </p>
            </div>
        );

    } catch (error: any) {
        return (
            <div className="text-center bg-white text-black">
                <div className="text-5xl mb-4">⚠️</div>
                <h1 className="text-xl font-semibold mb-2">エラーが発生しました</h1>
                <p className="text-sm text-destructive mb-4">
                    {error.message || "認証コードが無効か、期限切れです。"}
                </p>
                <p className="text-xs text-muted-foreground">
                    もう一度Botのボタンからやり直してください。
                </p>
            </div>
        );
    }
}