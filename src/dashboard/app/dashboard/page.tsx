import { auth } from "@/app/auth";
import { SignIn } from "@/app/components/login-button";
import { getGuilds } from "@/lib/discord";

import Client from "./client";

export default async function GuildsPage() {
  const session = await auth();

  if (!session?.user || !session.accessToken) {
    return <h2>ログイン後使用できます。</h2>;
  }

  return <Client></Client>;
}
