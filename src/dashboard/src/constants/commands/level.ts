import Permissions from "@/constants/Discord/Permissions";

const commands = [
  {
    name: "rank",
    description: "ユーザーのランクを表示します。",
    options: [
      {
        name: "user",
        description: "ユーザーを入力してください。",
        type: 6,
        required: false,
      },
    ],
  },
  {
    name: "levels",
    description: "レベルのランキングを表示します。"
  },
{
    name: "give-xp", 
    description: "ユーザーにXPを追加します。",
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
        description: "削除するXPの量を入力してください。",
        type: 4,
        required: true,
      },
    ]
  },
  {
    name: "remove-xp",
    description: "ユーザーのXPを削除します。",
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
        description: "削除するXPの量を入力してください。",
        type: 4,
        required: true,
      },
    ]
  }
];

export default commands