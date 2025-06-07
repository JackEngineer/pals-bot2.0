import type {
  User,
  Bottle,
  Reply,
  Discovery,
  BottleLike,
  BottleBookmark,
  UserSettings,
  UserStats,
  Tag,
  BottleTag,
  Follow,
  Report,
  Conversation,
  Message,
  Notification,
  Achievement,
  UserAchievement,
  MediaType,
  BottleStatus,
  ReplyStatus,
  ReportReason,
  ReportStatus,
  MessageType,
  NotificationType,
  AchievementCategory,
  AchievementRarity,
} from "@prisma/client";

// ==================== 基础类型扩展 ====================

export type UserWithRelations = User & {
  settings?: UserSettings | null;
  stats?: UserStats | null;
  bottles?: Bottle[];
  achievements?: UserAchievement[];
  followers?: Follow[];
  following?: Follow[];
};

export type BottleWithRelations = Bottle & {
  user: User;
  replies?: Reply[];
  likes?: BottleLike[];
  bookmarks?: BottleBookmark[];
  tags?: (BottleTag & { tag: Tag })[];
  _count?: {
    likes: number;
    replies: number;
    discoveries: number;
  };
};

export type ReplyWithUser = Reply & {
  user: User;
};

export type ConversationWithMessages = Conversation & {
  user1: User;
  user2: User;
  messages?: Message[];
  _count?: {
    messages: number;
  };
};

export type MessageWithUsers = Message & {
  sender: User;
  receiver: User;
};

export type NotificationWithData = Notification & {
  user: User;
};

export type AchievementWithProgress = Achievement & {
  userAchievement?: UserAchievement;
  isUnlocked?: boolean;
  progress?: number;
};

// ==================== API 请求/响应类型 ====================

export interface CreateBottleData {
  content: string;
  mediaType?: MediaType;
  mediaUrl?: string;
  bottleStyle?: Record<string, any>;
  latitude?: number;
  longitude?: number;
  location?: string;
  tagIds?: string[];
}

export interface UpdateBottleData {
  content?: string;
  mediaType?: MediaType;
  mediaUrl?: string;
  bottleStyle?: Record<string, any>;
  status?: BottleStatus;
  tagIds?: string[];
}

export interface CreateReplyData {
  content: string;
  mediaType?: MediaType;
  mediaUrl?: string;
  bottleId: string;
}

export interface CreateConversationData {
  receiverId: string;
  content: string;
  mediaType?: MediaType;
  mediaUrl?: string;
}

export interface CreateMessageData {
  content: string;
  mediaType?: MediaType;
  mediaUrl?: string;
  messageType?: MessageType;
  conversationId: string;
  receiverId: string;
}

export interface CreateReportData {
  reason: ReportReason;
  description?: string;
  bottleId?: string;
  replyId?: string;
  targetUserId?: string;
}

export interface UpdateUserSettingsData {
  allowDiscovery?: boolean;
  allowDirectMessages?: boolean;
  showOnlineStatus?: boolean;
  allowFollow?: boolean;
  notifyOnNewFollower?: boolean;
  notifyOnBottleReply?: boolean;
  notifyOnBottleLike?: boolean;
  notifyOnDirectMessage?: boolean;
  notifyOnAchievement?: boolean;
  contentLanguage?: string;
  adultContentFilter?: boolean;
}

export interface UpdateUserProfileData {
  firstName?: string;
  lastName?: string;
  bio?: string;
  avatarUrl?: string;
}

// ==================== 搜索和过滤类型 ====================

export interface BottleFilters {
  mediaType?: MediaType;
  status?: BottleStatus;
  tags?: string[];
  userId?: string;
  search?: string;
  hasLocation?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface UserFilters {
  search?: string;
  isActive?: boolean;
  isVerified?: boolean;
  minLevel?: number;
  maxLevel?: number;
}

export interface ConversationFilters {
  isActive?: boolean;
  hasUnreadMessages?: boolean;
  search?: string;
}

export interface NotificationFilters {
  type?: NotificationType;
  isRead?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface AchievementFilters {
  category?: AchievementCategory;
  rarity?: AchievementRarity;
  isUnlocked?: boolean;
  isActive?: boolean;
}

// ==================== 分页和排序类型 ====================

export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface SortParams {
  orderBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ==================== 统计数据类型 ====================

export interface UserStatsSummary {
  bottlesCreated: number;
  bottlesDiscovered: number;
  repliesReceived: number;
  repliesSent: number;
  likesReceived: number;
  likesGiven: number;
  followersCount: number;
  followingCount: number;
  achievementsCount: number;
  dailyStreak: number;
  longestStreak: number;
  level: number;
  experience: number;
  nextLevelExp: number;
}

export interface BottleStatsSummary {
  viewCount: number;
  likeCount: number;
  replyCount: number;
  bookmarkCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
}

export interface GlobalStatsSummary {
  totalUsers: number;
  totalBottles: number;
  totalReplies: number;
  totalLikes: number;
  activeUsersToday: number;
  bottlesToday: number;
  averageRepliesPerBottle: number;
  mostPopularTags: Array<{
    tag: Tag;
    count: number;
  }>;
}

// ==================== 成就系统类型 ====================

export interface AchievementRequirement {
  type:
    | "discovery_count"
    | "bottle_created"
    | "likes_received"
    | "followers_count"
    | "replies_sent"
    | "daily_streak"
    | "night_bottle"
    | "morning_bottle"
    | "ocean_themed_bottle"
    | "multimedia_bottles";
  value: number;
  timeframe?: "daily" | "weekly" | "monthly" | "all_time";
}

export interface AchievementProgress {
  achievement: Achievement;
  currentValue: number;
  targetValue: number;
  progress: number; // 0.0 - 1.0
  isUnlocked: boolean;
  unlockedAt?: Date;
}

// ==================== 实时通知类型 ====================

export interface NotificationData {
  type: NotificationType;
  title: string;
  content: string;
  data?: Record<string, any>;
  userId: string;
}

export interface RealtimeEvent {
  type:
    | "new_bottle"
    | "new_reply"
    | "new_like"
    | "new_follower"
    | "new_message"
    | "achievement_unlocked";
  data: any;
  userId?: string;
  timestamp: Date;
}

// ==================== 通用 API 响应类型 ====================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

// ==================== 导出所有 Prisma 类型 ====================

export type {
  User,
  Bottle,
  Reply,
  Discovery,
  BottleLike,
  BottleBookmark,
  UserSettings,
  UserStats,
  Tag,
  BottleTag,
  Follow,
  Report,
  Conversation,
  Message,
  Notification,
  Achievement,
  UserAchievement,
  MediaType,
  BottleStatus,
  ReplyStatus,
  ReportReason,
  ReportStatus,
  MessageType,
  NotificationType,
  AchievementCategory,
  AchievementRarity,
};
