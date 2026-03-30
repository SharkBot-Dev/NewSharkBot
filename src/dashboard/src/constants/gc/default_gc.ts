export interface GlobalChatRoom {
  name: string;
  description: string;
  rule: string;
  slowmode: number;
  min_account_age: number;
  total_messages: number;
  is_active: boolean;
  
  // リレーション (Has Many)
  members?: GlobalChatRoomUser[];
  connections?: GlobalChatConnect[];
  restrictions?: GlobalChatRoomRestriction[];
  filters?: GlobalChatRoomFilter[];

  created_at: string | Date;
  updated_at: string | Date;
}

export interface GlobalChatRoomUser {
  id: number;
  name: string; // RoomName
  user_id: string;
  role: 'owner' | 'admin' | 'mod' | 'member';
  joined_at: string | Date;
}

export interface GlobalChatRoomRestriction {
  id: number;
  name: string; // RoomName
  target_id: string;
  type: 'ban_user' | 'ban_server' | 'mute_user';
  reason: string;
  expires_at: string | Date | null;
  created_at: string | Date;
}

export interface GlobalChatRoomFilter {
  id: number;
  name: string; // RoomName
  word: string;
}

export interface GlobalChatConnect {
  channel_id: string;
  room_name: string;
  guild_id: string;
  webhook_url: string;
  created_at: string | Date;
  
  room?: GlobalChatRoom;
}

export const UserIds = {
    "owner": "1335428061541437531"
}