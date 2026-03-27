"use client";

import { Plus, Trash2, Coins, Package, Shield, Zap, ShoppingCart, Info } from "lucide-react";
import { useState } from "react";
import Modal from "@/components/Modal";
import RoleSelector from "@/components/role-selector";
import CollapsibleSection from "@/components/CollapsibleSection";
import CommandsControl from "@/components/commands";

interface EconomyItem {
  id: number;
  name: string;
  price: number;
  type: string;
  role_id?: string;
  auto_use: boolean;
  can_buy: boolean;
  can_buy_multiple: boolean;
}

interface Props {
  guildId: string;
  init_items: EconomyItem[];
}

const commands = [
  {
    name: "daily",
    description: "毎日一回のコインを得ます。"
  },
  {
    name: "work",
    description: "働いてコインを得ます。"
  },
  {
    name: "balance",
    description: "コインを確認します。",
    options: [
      {
        name: "user",
        description: "ユーザーを入力してください。",
        type: 6,
        required: true,
      }
    ]
  },
  {
    name: "shop",
    description: "ショップを確認します。"
  },
  {
    name: "buy",
    description: "アイテムを購入します。",
    options: [
        {
            name: "item",
            description: "購入するアイテムを入力してください。",
            type: 3,
            required: true
        },
        {
            name: "amount",
            description: "購入するアイテムの個数を入力してください。",
            type: 4
        }
    ]
  },
  {
    name: "inventory",
    description: "所持アイテムを確認します。"
  },
  {
    name: "use",
    description: "所持アイテムを使用します。",
    options: [
        {
            name: "item",
            description: "使用するアイテムを入力してください。",
            type: 3,
            required: true
        }
    ]
  }
];


export default function EconomyEditorClient({ guildId, init_items }: Props) {
  const [items, setItems] = useState<EconomyItem[]>(init_items);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // 新規アイテムの入力ステート
  const [newItem, setNewItem] = useState<Partial<EconomyItem>>({
    name: "",
    price: 0,
    type: "item",
    auto_use: false,
    can_buy: true,
    can_buy_multiple: true,
  });

  // アイテム作成
  const handleCreateItem = async () => {
    if (!newItem.name || newItem.price === undefined) return;
    setSaving(true);

    try {
      const res = await fetch(`/api/guilds/${guildId}/modules/economy/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem),
      });

      if (!res.ok) throw new Error();

      const data = await res.json();
      setItems((prev) => {
        const index = prev.findIndex(
          (item) => item.id === data.item.id || item.name === data.item.name,
        );
        if (index === -1) return [...prev, data.item];
        return prev.map((item, i) => (i === index ? data.item : item));
      });
      setIsModalOpen(false);
      setItems((prev) => prev.filter((item) => item.id !== item.id));
      alert("アイテムを追加しました。");
    } catch (err) {
      alert("保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  };

  // アイテム削除
  const handleDeleteItem = async (id: number) => {
    if (!confirm("アイテムを削除してもよろしいですか？")) return;

    try {
      const res = await fetch(`/api/guilds/${guildId}/modules/economy/items`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_id: id }),
      });

      if (!res.ok) throw new Error();

      setItems(items.filter((item) => item.id !== id));
      alert("削除しました。");
    } catch (err) {
      alert("削除に失敗しました。");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <CollapsibleSection title="コマンドの管理">
        <CommandsControl guildId={guildId} targetCommands={commands} />
      </CollapsibleSection>

      <CollapsibleSection title="アイテムの管理">
      {/* ヘッダーセクション */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 transition-colors px-4 py-2 rounded-lg font-medium"
      >
        <Plus size={18} /> アイテム追加
      </button><br/>

      {/* アイテムグリッド */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <div key={item.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-zinc-800 rounded-lg">
                <Package className="text-zinc-400" size={24} />
              </div>
              <button
                type="button"
                onClick={() => handleDeleteItem(item.id)}
                aria-label={`${item.name} を削除`}
                className="text-zinc-500 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              >
                <Trash2 size={18} />
              </button>
            </div>
            
            <h3 className="font-bold text-lg mb-1">{item.name}</h3>
            <div className="flex items-center gap-1 text-yellow-500 font-mono mb-4">
              <Coins size={14} /> {item.price.toLocaleString()}
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="text-[10px] uppercase tracking-wider bg-zinc-800 px-2 py-1 rounded text-zinc-400 font-bold">
                {item.type}
              </span>
              {item.auto_use && (
                <span className="flex items-center gap-1 text-[10px] bg-blue-500/10 text-blue-400 px-2 py-1 rounded border border-blue-500/20">
                  <Zap size={10} /> 自動使用
                </span>
              )}
              {item.role_id && (
                <span className="flex items-center gap-1 text-[10px] bg-purple-500/10 text-purple-400 px-2 py-1 rounded border border-purple-500/20">
                  <Shield size={10} /> ロール付与
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      </CollapsibleSection>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <h2 className="text-xl font-bold mb-2 text-black">アイテムを作成する</h2>
        <div className="space-y-5 p-1">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-bold text-zinc-500 uppercase ml-1">アイテム名</label>
              <input
                type="text"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 mt-1 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="例: VIPパス"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase ml-1">価格</label>
              <input
                type="number"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 mt-1 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                value={newItem.price}
                onChange={(e) => setNewItem({ ...newItem, price: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-500 uppercase ml-1">アイテムタイプ</label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                onClick={() => setNewItem({ ...newItem, type: "item", role_id: "" })}
                className={`py-2 rounded-lg border font-medium text-sm transition-all ${newItem.type === 'item' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'}`}
              >
                通常アイテム
              </button>
              <button
                onClick={() => setNewItem({ ...newItem, type: "role" })}
                className={`py-2 rounded-lg border font-medium text-sm transition-all ${newItem.type === 'role' ? 'bg-purple-600 border-purple-500 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'}`}
              >
                ロール付与
              </button>
            </div>
          </div>

          {newItem.type === "role" && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
              <label className="text-xs font-bold text-zinc-500 uppercase ml-1 flex items-center gap-1">
                付与するロール <Info size={12} className="text-zinc-600" />
              </label>
              <div className="mt-1">
                <RoleSelector 
                  guildId={guildId} 
                  value={newItem.role_id} 
                  onChange={(id) => setNewItem({ ...newItem, role_id: id })} 
                />
              </div>
              <p className="text-[10px] text-zinc-500 mt-1 ml-1">※Botの権限より下のロールのみ付与可能です。</p>
            </div>
          )}

          <div className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700/50 space-y-3">
            <label className="flex items-center justify-between cursor-pointer group">
              <span className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors">購入時に自動で使用する</span>
              <input
                type="checkbox"
                className="w-5 h-5 rounded border-zinc-600 bg-zinc-700 text-indigo-600 focus:ring-offset-zinc-900 transition-all"
                checked={newItem.auto_use}
                onChange={(e) => setNewItem({ ...newItem, auto_use: e.target.checked })}
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer group">
              <span className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors">複数個の所持を許可する</span>
              <input
                type="checkbox"
                className="w-5 h-5 rounded border-zinc-600 bg-zinc-700 text-indigo-600 focus:ring-offset-zinc-900 transition-all"
                checked={newItem.can_buy_multiple}
                onChange={(e) => setNewItem({ ...newItem, can_buy_multiple: e.target.checked })}
              />
            </label>
          </div>

          <button
            onClick={handleCreateItem}
            disabled={saving || !newItem.name || (newItem.type === 'role' && !newItem.role_id)}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed py-3 rounded-xl font-bold mt-2 shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98]"
          >
            {saving ? "保存中..." : "アイテムを登録"}
          </button>
        </div>
      </Modal>
    </div>
  );
}