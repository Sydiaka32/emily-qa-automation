export const MessageStatus = {
  completed: "completed",
} as const;

export type MessageStatus = (typeof MessageStatus)[keyof typeof MessageStatus];
