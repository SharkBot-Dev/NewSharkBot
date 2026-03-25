import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import Client from "./client";

const unauthorizedResponse = <h2>ログイン後使用できます。</h2>;

export default async function GuildsPage() {
  const allLinkedAccounts = await auth.api.listUserAccounts({
    headers: await headers(),
  });
  const discordAccountData = allLinkedAccounts.find(
    (account) => account.providerId === "discord",
  );
  if (!discordAccountData) {
    return unauthorizedResponse;
  }
  const discordToken = await auth.api.getAccessToken({
    headers: await headers(),
    body: {
      providerId: "discord",
      accountId: discordAccountData.accountId,
      userId: discordAccountData.userId,
    },
  });

  if (
    !discordToken.accessTokenExpiresAt ||
    Date.now() >= new Date(discordToken.accessTokenExpiresAt).getTime()
  ) {
    return unauthorizedResponse;
  }

  return <Client></Client>;
}
