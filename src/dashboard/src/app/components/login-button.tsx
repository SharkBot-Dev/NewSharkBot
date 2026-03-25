import { authClient } from "@/lib/auth-client";

export function SignIn() {
  return (
    <form
      action={async () => {
        "use server";
        await authClient.signIn.social({
          provider: "discord",
          callbackURL: `/dashboard`,
        });
      }}
    >
      <button
        type="submit"
        className="px-4 py-2 bg-[#5865F2] text-white rounded-md hover:bg-[#4752C4] transition-colors"
      >
        Discordでログイン
      </button>
    </form>
  );
}
