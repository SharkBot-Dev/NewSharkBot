import { SignIn } from "@/components/login-button";
import { 
  ShieldCheck, 
  Zap, 
  Settings2, 
  Trash2, 
  Trophy, 
  Activity,
  BookOpen,
  Globe
} from "lucide-react";
import Link from "next/link";

export default async function Page() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <header className="mb-16 text-center">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
          SharkBot
        </h1>
        <p className="text-lg text-slate-600 mt-4 max-w-2xl mx-auto">
          あなたのサーバーを、あなた好みに。<br/>
          高機能な管理ツールと、メンバーを熱中させるエンタメ機能をこれ一つで。
        </p>
        <div className="mt-8">
          <SignIn />
        </div>
      </header>

      <main className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center mb-6">
              <Settings2 size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900">高度なカスタマイズ性</h3>
            <p className="text-slate-500 mt-3 leading-relaxed">
              プレフィックスの変更から、各機能の細かな挙動まで設定可能。あなたのコミュニティのルールに完璧にフィットさせることができます。
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center mb-6">
              <Trash2 size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900">不要な機能をオフに</h3>
            <p className="text-slate-500 mt-3 leading-relaxed">
              「このコマンドはいらないな」と思ったら、モジュール単位で簡単に無効化。サーバーのメニューを常にクリーンな状態に保てます。
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
            <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-lg flex items-center justify-center mb-6">
              <Trophy size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900">レベル ＆ 実績機能</h3>
            <p className="text-slate-500 mt-3 leading-relaxed">
              発言量に応じたレベルアップや、特定の条件で解除される実績システムを搭載。メンバーのモチベーションとアクティブ率を向上させます。
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-6">
              <ShieldCheck size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900">安心の守護神</h3>
            <p className="text-slate-500 mt-3 leading-relaxed">
              強力なモデレーションツールで荒らし対策も万全。管理者の負担を大幅に軽減し、平和なコミュニティ作りをサポートします。
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
            <div className="w-12 h-12 bg-sky-100 text-sky-600 rounded-lg flex items-center justify-center mb-6">
              <Globe size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900">グローバルチャット</h3>
            <p className="text-slate-500 mt-3 leading-relaxed">
              他のサーバーとチャンネルを同期し、リアルタイムで交流。あなたのサーバーにいながら、世界中のユーザーと会話を楽しめます。
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
            <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center mb-6">
              <Zap size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900">ストレスフリーな動作</h3>
            <p className="text-slate-500 mt-3 leading-relaxed">
              最新技術を用いた最適化により、どんなに大規模なサーバーでも遅延の少ないスムーズなレスポンスを提供します。
            </p>
          </div>

        </div>
      </main><br/>

      <section className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link 
          href="https://wiki.sharkbot.xyz" 
          target="_blank"
          className="flex items-center p-4 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors border border-slate-200 group"
          rel="noopener noreferrer"
        >
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mr-4 shadow-sm">
            <BookOpen size={20} className="text-slate-600" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 group-hover:text-blue-600">公式ドキュメント</div>
            <div className="text-xs text-slate-500">導入方法やコマンド一覧を確認</div>
          </div>
        </Link>

        <Link 
          href="https://status.sharkbot.xyz/status" 
          target="_blank"
          className="flex items-center p-4 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors border border-slate-200 group"
          rel="noopener noreferrer"
        >
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mr-4 shadow-sm">
            <Activity size={20} className="text-emerald-500" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 group-hover:text-emerald-600">稼働状況</div>
            <div className="text-xs text-slate-500">現在のBotの動作状況をチェック</div>
          </div>
        </Link>
      </section>
    </div>
  );
}