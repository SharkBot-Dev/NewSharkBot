"use client";

import CollapsibleSection from "@/components/CollapsibleSection";
import CommandsControl from "@/components/commands";
import EmbedSelecter from "@/components/EmbedSelecter";
import commands from "@/constants/commands/achievements";
import { Plus, Trash2, Save, Send, Bell, Settings, Award, Layers, Target, Trash } from "lucide-react";
import { useState, useEffect } from "react";

// --- 型定義などは変更なし ---
interface AchievementStep {
  id?: number;
  name: string;
  threshold: number;
  reward_role_id: string;
}

interface Achievement {
  id?: number;
  name: string;
  description: string;
  type: string;
  is_step: boolean;
  steps: AchievementStep[];
}

interface AchievementSetting {
  notify_channel_id: string;
  is_notify_enabled: boolean;
  content: string;
  embed_id: string;
}

interface Props {
  guildId: string;
  roles: any[];
  channels: any[];
  initSettings: {
    achievements: Achievement[];
    settings: AchievementSetting;
  };
}

const toSafeNumber = (val: string) => {
  const num = Number(val);
  return Number.isNaN(num) ? 0 : num;
};

export default function AchievementsClient({ guildId, roles, channels, initSettings }: Props) {
  const [achievements, setAchievements] = useState<Achievement[]>(initSettings.achievements || []);
  const [settings, setSettings] = useState<AchievementSetting>(initSettings.settings || {
    notify_channel_id: "",
    is_notify_enabled: true,
    content: "🎉 {ユーザー名}が実績【{実績名}（{ステップ名}）】を達成しました！",
    embed_id: ""
  });
  const [loading, setLoading] = useState(false);

  const handleSaveAll = async () => {
    setLoading(true);
    try {
      const cleanedAchievements = achievements.map(ach => {
        let steps = ach.steps;

        if (ach.is_step) {
          steps = [...ach.steps].sort((a, b) => a.threshold - b.threshold);

          for (let i = 1; i < steps.length; i++) {
            if (steps[i].threshold <= steps[i - 1].threshold) {
              throw new Error(
                `実績「${ach.name}」のステップ設定が不正です: ` +
                `閾値 ${steps[i].threshold} は前のステップ (${steps[i - 1].threshold}) より大きい必要があります。`
              );
            }
          }
        } else {
          steps = [ach.steps[0]];
        }

        return {
          ...ach,
          steps: steps
        };
      });

      // 全ての実績を保存し、レスポンス（ID確定後のデータ）を配列に格納
      const savedAchievements = [];
      
      for (const ach of cleanedAchievements) {
        const res = await fetch(`/api/guilds/${guildId}/modules/achievements`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "list", data: ach }),
        });

        if (res.ok) {
          const result = await res.json();
          savedAchievements.push(result.data || result); 
        }
      }

      // 通知設定の保存
      await fetch(`/api/guilds/${guildId}/modules/achievements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "setting", data: settings }),
      });

      // 【重要】サーバーから戻ってきた「ID付きのデータ」でステートを更新
      if (savedAchievements.length > 0) {
        setAchievements(savedAchievements);
      }

      alert("設定を保存しました。");
    } catch (e) {
      console.error(e);
      alert("保存に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  // --- 実績の操作 ---
  const addAchievement = () => {
    const newAch: Achievement = {
      name: "新しい実績",
      description: "",
      type: "messages",
      is_step: false,
      // 初期状態は1つだけ
      steps: [{ name: "達成", threshold: 1, reward_role_id: "" }]
    };
    setAchievements([...achievements, newAch]);
  };

  const removeAchievement = async (index: number, id?: number) => {
    if (!id) {
      setAchievements(achievements.filter((_, i) => i !== index));
      return;
    }

    if (!confirm("この実績をサーバーから完全に削除しますか？")) return;

    try {
      const res = await fetch(`/api/guilds/${guildId}/modules/achievements`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ achievement_id: id }),
      });

      if (res.ok) {
        setAchievements(achievements.filter((_, i) => i !== index));
        alert("削除しました");
      } else {
        const err = await res.json();
        alert(`削除に失敗しました: ${err.message || 'Unknown error'}`);
      }
    } catch (e) {
      alert("通信エラーが発生しました");
    }
  };

  const toggleStepMode = (achIdx: number, enabled: boolean) => {
    const nextAchs = [...achievements];
    nextAchs[achIdx].is_step = enabled;
    
    // 段階的実績をOFFにした場合、2番目以降のステップを削除する
    if (!enabled && nextAchs[achIdx].steps.length > 1) {
      nextAchs[achIdx].steps = [nextAchs[achIdx].steps[0]];
    }
    setAchievements(nextAchs);
  };

  const addStep = (achIndex: number) => {
    const newAch = [...achievements];
    // 直前のステップの目標値 + 10 をデフォルトにするなど工夫
    const lastThreshold = newAch[achIndex].steps[newAch[achIndex].steps.length - 1]?.threshold || 0;
    newAch[achIndex].steps.push({ 
      name: "新段階", 
      threshold: lastThreshold + 10, 
      reward_role_id: "" 
    });
    setAchievements(newAch);
  };

  // --- レンダリング部分は変更箇所以外ほぼ同じ ---
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 text-slate-800">
      <CollapsibleSection title="必要なコマンド設定"><CommandsControl guildId={guildId} targetCommands={commands} /></CollapsibleSection>
      <div className="max-w-4xl mx-auto space-y-8">
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Settings className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">全体設定</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-600">通知チャンネル</label>
              <select 
                className="w-full bg-white p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                value={settings.notify_channel_id}
                onChange={(e) => setSettings({...settings, notify_channel_id: e.target.value})}
              >
                <option value="">通知しない</option>
                {channels.map(c => <option key={c.id} value={c.id}>#{c.name}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-3 md:mt-8">
              <input 
                type="checkbox" 
                id="notify_enabled"
                className="w-5 h-5"
                checked={settings.is_notify_enabled}
                onChange={(e) => setSettings({...settings, is_notify_enabled: e.target.checked})}
              />
              <label htmlFor="notify_enabled" className="text-sm font-medium">通知を有効化する</label>
            </div>
          </div>
          
          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-600">メッセージ内容</label>
              <textarea
                className="w-full border border-gray-300 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                placeholder="🎉 {ユーザー名}が実績【{実績名}（{ステップ名}）】を達成しました！"
                value={settings.content}
                onChange={(e) => setSettings({...settings, content: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-600">埋め込み選択</label>
              <EmbedSelecter value={settings.embed_id} onChange={(e) => setSettings({...settings, embed_id: e})} guildId={guildId} />
            </div>
          </div>
        </section>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-black flex items-center gap-2 text-slate-900">
              <Award className="w-7 h-7 text-amber-500" /> 実績一覧
            </h2>
            <button 
              onClick={addAchievement} 
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-sm"
            >
              <Plus className="w-4 h-4" /> 実績を追加
            </button>
          </div>

          <div className="space-y-6">
            {achievements.map((ach, achIdx) => (
              <div key={achIdx} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                  <input 
                    value={ach.name}
                    onChange={(e) => {
                      const n = [...achievements]; n[achIdx].name = e.target.value; setAchievements(n);
                    }}
                    className="bg-transparent font-bold text-lg outline-none border-b border-transparent focus:border-blue-500 px-1 w-full max-w-md"
                  />
                  <button 
                    onClick={() => removeAchievement(achIdx, ach.id)} 
                    className="p-2 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase block mb-2">達成タイプ</label>
                      <select 
                        className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg"
                        value={ach.type}
                        onChange={(e) => {
                          const n = [...achievements]; n[achIdx].type = e.target.value; setAchievements(n);
                        }}
                      >
                        <option value="messages">メッセージ数</option>
                        <option value="reactions">リアクション数</option>
                        <option value="manual">手動付与</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-3 md:mt-8">
                      <input 
                        type="checkbox" 
                        id={`step-${achIdx}`}
                        className="w-5 h-5"
                        checked={ach.is_step}
                        onChange={(e) => toggleStepMode(achIdx, e.target.checked)}
                      />
                      <label htmlFor={`step-${achIdx}`} className="text-sm font-medium">段階的な実績</label>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-4">
                    <p className="text-sm font-bold text-slate-700 border-b border-slate-200 pb-2">達成条件と報酬</p>
                    
                    <div className="space-y-3">
                      {ach.steps.map((step, sIdx) => (
                        <div key={sIdx} className="flex flex-wrap gap-4 items-end bg-white p-4 rounded-lg border border-slate-200 shadow-sm relative">
                          <div className="flex-1 min-w-[140px]">
                            <label className="text-[11px] font-bold text-slate-400 mb-1 block">段階名</label>
                            <input 
                              className="w-full border border-gray-200 p-2 rounded text-sm focus:border-blue-500 outline-none"
                              value={step.name}
                              onChange={(e) => {
                                const n = [...achievements]; n[achIdx].steps[sIdx].name = e.target.value; setAchievements(n);
                              }}
                            />
                          </div>
                          <div className="w-28">
                            <label className="text-[11px] font-bold text-slate-400 mb-1 block">目標値</label>
                            <input 
                              type="number"
                              className="w-full border border-gray-200 p-2 rounded text-sm focus:border-blue-500 outline-none"
                              value={step.threshold}
                              onChange={(e) => {
                                const n = [...achievements]; n[achIdx].steps[sIdx].threshold = toSafeNumber(e.target.value); setAchievements(n);
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-[180px]">
                            <label className="text-[11px] font-bold text-slate-400 mb-1 block">付与ロール</label>
                            <select 
                              className="w-full border border-gray-200 p-2 rounded text-sm focus:border-blue-500 outline-none"
                              value={step.reward_role_id}
                              onChange={(e) => {
                                const n = [...achievements]; n[achIdx].steps[sIdx].reward_role_id = e.target.value; setAchievements(n);
                              }}
                            >
                              <option value="">ロールなし</option>
                              {roles.map(r => <option key={r.id} value={r.id} style={{color: r.color}}>{r.name}</option>)}
                            </select>
                          </div>
                          {/* ステップ削除ボタンは is_step が true かつ 2つ以上の時のみ */}
                          {ach.is_step && ach.steps.length > 1 && (
                            <button 
                              onClick={() => {
                                const n = [...achievements]; n[achIdx].steps.splice(sIdx, 1); setAchievements(n);
                              }}
                              className="p-2 text-gray-300 hover:text-red-500"
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {ach.is_step && (
                      <button 
                        onClick={() => addStep(achIdx)} 
                        className="w-full py-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 text-sm font-medium hover:border-blue-400 hover:text-blue-500 flex items-center justify-center gap-1"
                      >
                        <Plus className="w-4 h-4" /> 段階を追加
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="sticky bottom-8 flex justify-center pt-4">
          <button 
            onClick={handleSaveAll}
            disabled={loading}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-10 py-4 rounded-full shadow-xl transition-all disabled:opacity-50 font-bold"
          >
            {loading ? "保存中..." : <><Save className="w-5 h-5" /> 全ての設定を保存する</>}
          </button>
        </div>
      </div>
    </div>
  );
}