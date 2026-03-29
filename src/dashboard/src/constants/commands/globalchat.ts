import Permissions from "@/constants/Discord/Permissions";

const requiredPermissions = (
  BigInt(Permissions.ManageChannels) | BigInt(Permissions.ManageWebhooks)
).toString();

const commands = [
  {
    name: "connect",
    description: "グローバルチャットに接続します。",
    default_member_permissions: requiredPermissions, 
    options: [
      {
        name: "name",
        description: "ルーム名を入力してください。",
        type: 3,
        required: false,
      }
    ]
  }
];

export default commands;