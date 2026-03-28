const commands = [
  {
    name: "imgur",
    description: "Imgurで画像を検索します。",
    options: [
      {
        name: "search",
        description: "検索ワードを入力してください。",
        type: 3,
        required: true,
      },
    ],
  },
];

export default commands