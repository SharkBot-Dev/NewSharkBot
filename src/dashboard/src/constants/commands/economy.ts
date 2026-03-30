import Permissions from "@/constants/Discord/Permissions";

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
  },
  {
    name: "leaderboard",
    description: "コイン所持量のランキングを表示します。"
  },
  {
    name: "add-money",
    description: "メンバーにお金を追加します。",
    default_member_permissions: Permissions.ManageGuild.toString(), 
    options: [
        {
          name: "user",
          description: "ユーザーを入力してください。",
          type: 6,
          required: true,
        },
        {
            name: "amount",
            description: "渡す金額を入力",
            type: 4,
            required: true
        }
    ]
  },
  {
    name: "remove-money",
    description: "メンバーからお金を奪います。",
    default_member_permissions: Permissions.ManageGuild.toString(), 
    options: [
        {
          name: "user",
          description: "ユーザーを入力してください。",
          type: 6,
          required: true,
        },
        {
            name: "amount",
            description: "奪う金額を入力",
            type: 4,
            required: true
        }
    ]
  },
  {
    name: "spawn-item",
    description: "アイテムをメンバーのインベントリに追加します。",
    default_member_permissions: Permissions.ManageGuild.toString(), 
    options: [
        {
          name: "user",
          description: "ユーザーを入力してください。",
          type: 6,
          required: true,
        },
        {
          name: "item",
          description: "アイテム名を入力してください。",
          type: 3,
          required: true
        }
    ]
  },
  {
    name: "guess",
    description: "1から100までの数字を推測してコインを獲得できます。",
    options: [
        {
            name: "amount",
            description: "賭ける金額を入力してください。",
            type: 4,
            required: true
        }
    ]
  },
  {
    name: "dice",
    description: "コインを賭けてダイスを振ります。",
    options: [
        {
            name: "amount",
            description: "賭ける金額を入力してください。",
            type: 4,
            required: true
        }
    ]
  },
  {
    name: "bj",
    description: "ブラックジャックでコインを賭けて遊びます。",
    options: [
        {
            name: "amount",
            description: "賭ける金額を入力してください。",
            type: 4,
            required: true
        }
    ]
  }
];

export default commands