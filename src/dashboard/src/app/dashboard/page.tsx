import { auth } from "@/app/auth";

import Client from "./client";

export default async function GuildsPage() {
  const session = await auth();

  if (!session?.user || !session.accessToken) {
    return <h2>ログイン後使用できます。</h2>;
  }

  return <Client></Client>;
}
