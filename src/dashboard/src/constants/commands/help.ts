const commands = [
  {
    name: "help",
    description: "Botのコマンド一覧や詳細を表示します。",
    options: [
      {
        name: "command",
        description: "詳細を表示したいコマンド名を入力してください。",
        type: 3,
        required: false,
      },
    ],
  },
  {
    name: "dashboard",
    description: "ダッシュボードの案内を表示します。",
  },
];

export default commands