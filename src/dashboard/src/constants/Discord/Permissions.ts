const Permissions = {
  // 一般権限
  CreateInstantInvite: BigInt(1) << BigInt(0),   // 招待作成
  KickMembers: BigInt(1) << BigInt(1),          // メンバーをキック
  BanMembers: BigInt(1) << BigInt(2),           // メンバーをBAN
  Administrator: BigInt(1) << BigInt(3),        // 管理者 (全権限)
  ManageChannels: BigInt(1) << BigInt(4),       // チャンネルの管理
  ManageGuild: BigInt(1) << BigInt(5),          // サーバーの管理
  AddReactions: BigInt(1) << BigInt(6),         // リアクションの追加
  ViewAuditLog: BigInt(1) << BigInt(7),         // 監査ログを表示
  PrioritySpeaker: BigInt(1) << BigInt(8),      // 優先スピーカー
  Stream: BigInt(1) << BigInt(9),               // 画面共有
  ViewChannel: BigInt(1) << BigInt(10),         // チャンネルを見る (メッセージを読む)

  // メッセージ関連
  SendMessages: BigInt(1) << BigInt(11),        // メッセージを送信
  SendTTSMessages: BigInt(1) << BigInt(12),     // TTSメッセージを送信
  ManageMessages: BigInt(1) << BigInt(13),      // メッセージの管理
  EmbedLinks: BigInt(1) << BigInt(14),          // 埋め込みリンク
  AttachFiles: BigInt(1) << BigInt(15),         // ファイル添付
  ReadMessageHistory: BigInt(1) << BigInt(16),  // メッセージ履歴を読む
  MentionEveryone: BigInt(1) << BigInt(17),     // @everyone, @here, 全ロールにメンション
  UseExternalEmojis: BigInt(1) << BigInt(18),   // 外部の絵文字を使用
  ViewGuildInsights: BigInt(1) << BigInt(19),   // サーバー分析を表示

  // 音声関連
  Connect: BigInt(1) << BigInt(20),             // 接続
  Speak: BigInt(1) << BigInt(21),               // 発言
  MuteMembers: BigInt(1) << BigInt(22),         // メンバーをミュート
  DeafenMembers: BigInt(1) << BigInt(23),       // メンバーのスピーカーをオフ
  MoveMembers: BigInt(1) << BigInt(24),         // メンバーを移動
  UseVAD: BigInt(1) << BigInt(25),              // 音声検出を使用

  // その他・高度な権限
  ChangeNickname: BigInt(1) << BigInt(26),      // ニックネームの変更
  ManageNicknames: BigInt(1) << BigInt(27),     // ニックネームの管理
  ManageRoles: BigInt(1) << BigInt(28),         // ロールの管理
  ManageWebhooks: BigInt(1) << BigInt(29),      // Webhookの管理
  ManageEmojisAndStickers: BigInt(1) << BigInt(30), // 絵文字・スタンプ
  UseApplicationCommands: BigInt(1) << BigInt(31),  // アプリコマンド
  RequestToSpeak: BigInt(1) << BigInt(32),      // スピーカーをリクエスト
  ManageEvents: BigInt(1) << BigInt(33),        // イベントの管理
  ManageThreads: BigInt(1) << BigInt(34),       // スレッドの管理
  CreatePublicThreads: BigInt(1) << BigInt(35), // 公開スレッド作成
  CreatePrivateThreads: BigInt(1) << BigInt(36),// 非公開スレッド作成
  UseExternalStickers: BigInt(1) << BigInt(37), // 外部スタンプ
  SendMessagesInThreads: BigInt(1) << BigInt(38), // スレッド内送信
  UseEmbeddedActivities: BigInt(1) << BigInt(39), // アクティビティ
  ModerateMembers: BigInt(1) << BigInt(40),     // メンバーのタイムアウト
};

export default Permissions;