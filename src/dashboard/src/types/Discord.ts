/** biome-ignore-all lint/suspicious/noExplicitAny: NotImplemented */

/** Discord Guild Object (https://discord.com/developers/docs/resources/guild#guild-object) */
export interface DiscordGuild {
  id: string; // guild id (snowflake)
  name: string; // guild name
  icon: string | null; // icon hash
  icon_hash?: string | null; // icon hash (template object)
  splash: string | null; // splash hash
  discovery_splash: string | null; // discovery splash hash
  owner?: boolean; // true if the user is the owner of the guild (GET Current User Guilds)
  owner_id: string; // id of owner (snowflake)
  permissions?: string; // total permissions for the user in the guild (GET Current User Guilds)
  region?: string | null; // voice region id for the guild (deprecated)
  afk_channel_id: string | null; // id of afk channel (snowflake)
  afk_timeout: number; // afk timeout in seconds
  widget_enabled?: boolean; // true if the server widget is enabled
  widget_channel_id?: string | null; // channel id for widget invite
  verification_level: number; // verification level required for the guild
  default_message_notifications: number; // default message notifications level
  explicit_content_filter: number; // explicit content filter level
  roles: any[]; // array of role objects
  emojis: any[]; // array of emoji objects
  features: string[]; // enabled guild features
  mfa_level: number; // required MFA level for the guild
  application_id: string | null; // application id of the guild creator if bot-created
  system_channel_id: string | null; // id of the channel for guild notices
  system_channel_flags: number; // system channel flags
  rules_channel_id: string | null; // id of the channel for Community guild rules
  max_presences?: number | null; // max number of presences (null except for largest guilds)
  max_members?: number; // max number of members
  vanity_url_code: string | null; // vanity url code
  description: string | null; // description of the guild
  banner: string | null; // banner hash
  premium_tier: number; // premium tier (Server Boost level)
  premium_subscription_count?: number; // number of boosts
  preferred_locale: string; // preferred locale of a Community guild
  public_updates_channel_id: string | null; // id of the channel for Community updates
  max_video_channel_users?: number; // max users in a video channel
  max_stage_video_channel_users?: number; // max users in a stage video channel
  approximate_member_count?: number; // approximate number of members (with_counts=true)
  approximate_presence_count?: number; // approximate number of non-offline members (with_counts=true)
  welcome_screen?: any; // welcome screen object
  nsfw_level: number; // guild age-restriction level
  stickers?: any[]; // custom guild stickers
  premium_progress_bar_enabled: boolean; // whether boost progress bar is enabled
  safety_alerts_channel_id?: string | null; // id of the channel for safety alerts
  incidents_data?: any; // incidents data object
}
