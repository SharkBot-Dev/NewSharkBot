import Permissions from "@/constants/Discord/Permissions";

const commands = [
  {
    name: "kick", 
    description: "メンバーをキックします。",
    default_member_permissions: Permissions.KickMembers.toString(), 
    options: [
      {
        name: "member",
        description: "メンバーを選択してください。",
        type: 6,
        required: true,
      },
      {
        name: "reason",
        description: "キックする理由を入力してください。",
        type: 3,
        required: false,
      },
    ]
  },
  {
    name: "ban",
    description: "ユーザーをBanします。",
    default_member_permissions: Permissions.BanMembers.toString(),
    options: [
      {
        name: "user",
        description: "ユーザーを入力してください。",
        type: 6,
        required: true,
      },
      {
        name: "reason",
        description: "Banする理由を入力してください。",
        type: 3,
        required: false,
      },
    ]
  },
  {
    name: "unban",
    description: "ユーザーのBanを解除します。",
    default_member_permissions: Permissions.BanMembers.toString(),
    options: [
      {
        name: "user",
        description: "ユーザーを入力してください。",
        type: 6,
        required: true,
      },
      {
        name: "reason",
        description: "Banを解除する理由を入力してください。",
        type: 3,
        required: false,
      },
    ]
  },
  {
    name: "timeout",
    description: "ユーザーをタイムアウトします。",
    default_member_permissions: Permissions.ModerateMembers.toString(),
    options: [
      {
        name: "member",
        description: "メンバーを選択してください。",
        type: 6,
        required: true,
      },
      {
        name: "duration",
        description: "タイムアウトする時間を入力してください。",
        type: 3,
        required: true,
      },
      {
        name: "reason",
        description: "タイムアウトする理由を入力してください。",
        type: 3,
        required: false,
      },
    ]
  },
  {
    name: "remove-timeout",
    description: "ユーザーのタイムアウトを解除します。",
    default_member_permissions: Permissions.ModerateMembers.toString(),
    options: [
      {
        name: "member",
        description: "メンバーを選択してください。",
        type: 6,
        required: true,
      },
      {
        name: "reason",
        description: "タイムアウトする理由を入力してください。",
        type: 3,
        required: false,
      },
    ]
  },
  {
    name: "clear",
    description: "メッセージを複数個削除します。",
    default_member_permissions: Permissions.ManageMessages.toString(),
    options: [
      {
        name: "amount",
        description: "削除する個数を選択してください。",
        type: 4,
        required: true,
      },
    ]
  },
  
  {
    name: "warn",
    description: "ユーザーを警告します。",
    default_member_permissions: Permissions.ManageNicknames.toString(),
    options: [
      {
        name: "user",
        description: "ユーザーを入力してください。",
        type: 6,
        required: true,
      },
      {
        name: "reason",
        description: "警告する理由を入力してください。",
        type: 3,
        required: false,
      },
    ]
  },
  {
    name: "user-info",
    description: "ユーザーの情報を表示します。",
    options: [
      {
        name: "user",
        description: "ユーザーを入力してください。",
        type: 6,
        required: false,
      }
    ]
  },
  {
    name: "role-info",
    description: "ロールの情報を表示します。",
    options: [
      {
        name: "role",
        description: "ユーザーを入力してください。",
        type: 8,
        required: true,
      }
    ]
  },
  {
    name: "server-info",
    description: "サーバーの情報を表示します。"
  }
];

export default commands