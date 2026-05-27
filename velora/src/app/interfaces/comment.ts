export interface CommentReply {
  id: number;
  userId: number;
  userName: string;
  userAvatar: string;
  text: string;
  date: string;
}

export interface ProductComment {
  id: number;
  productId: number;
  userId: number;
  userName: string;
  userAvatar: string;
  text: string;
  rating: number;
  date: string;
  replies: CommentReply[];
}
