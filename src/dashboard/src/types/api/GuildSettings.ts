export interface GuildSettings {
  guildId: string;
  enabledModules: Record<string, boolean>;
  createdAt: Date;
  updatedAt: Date;
}
