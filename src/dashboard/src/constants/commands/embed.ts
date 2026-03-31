import Permissions from "@/constants/Discord/Permissions";

const commands = [
  {
    name: "embed",
    description: "埋め込みを作成＆保存します。",
    default_member_permissions: Permissions.ManageGuild.toString(), 
  }
];

export default commands