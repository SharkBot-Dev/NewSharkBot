export interface LevelRewardRole {
  roleId: string;
  level: number;
}

export interface LevelRewardRoleSetting {
  guildId: string;
  roles: LevelRewardRole[];
}