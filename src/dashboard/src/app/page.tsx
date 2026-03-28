import { SignIn } from "@/components/login-button";

export default async function Page() {
  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <header className="mb-8 text-center">
        <h1 className="text-2xl font-extrabold text-slate-900">SharkBot</h1>
        <p className="text-sm text-slate-500 mt-2">
          サーバー管理を楽にするBot
        </p>
      </header>

      <div className="mb-8 text-center">
        <SignIn />
      </div>
    </div>
  );
}
