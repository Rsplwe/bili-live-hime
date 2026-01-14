export interface Comment {
  id: string;
  username: string;
  avatar?: string;
  message: string;
  timestamp: Date;
  type: "chat" | "superchat" | "gift" | "enter";
  badge?: string;
  giftName?: string;
  giftCount?: number;
  amount?: number;
}
