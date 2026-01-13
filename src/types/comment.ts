export interface Comment {
    id: string
    username: string
    avatar?: string
    message: string
    timestamp: Date
    type: "chat" | "gift" | "enter"
    badge?: string
    giftName?: string
    giftCount?: number
}