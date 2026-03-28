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

export default commands