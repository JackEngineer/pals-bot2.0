export const formatConversation = (conv: any, userId: string) => {
  const otherUser = conv.user1Id === userId ? conv.user2 : conv.user1;
  const lastMessage = conv.messages[0] || null;

  // 计算未读消息数
  const hasUnreadMessage =
    lastMessage && !lastMessage.isRead && lastMessage.senderId !== userId;

  return {
    id: conv.id,
    otherUser: {
      id: otherUser.id,
      firstName: otherUser.firstName,
      lastName: otherUser.lastName,
      username: otherUser.username,
      avatarUrl: otherUser.avatarUrl,
    },
    lastMessage,
    lastMessageAt: conv.lastMessageAt,
    createdAt: conv.createdAt,
    hasUnread: hasUnreadMessage,
  };
};
