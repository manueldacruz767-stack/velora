import { Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ProductComment, CommentReply } from '../interfaces/comment';

@Injectable({ providedIn: 'root' })
export class CommentService {
  private storageKey = 'velora_comments';
  private commentsSignal = signal<ProductComment[]>(this.loadComments());

  getComments(productId: number): Observable<ProductComment[]> {
    return of(this.commentsSignal().filter(c => c.productId === productId));
  }

  getAllComments(): Observable<ProductComment[]> {
    return of(this.commentsSignal());
  }

  addComment(
    productId: number,
    userId: number,
    userName: string,
    userAvatar: string,
    text: string,
    rating: number
  ): Observable<ProductComment> {
    const comment: ProductComment = {
      id: Date.now(),
      productId,
      userId,
      userName,
      userAvatar,
      text,
      rating,
      date: new Date().toISOString(),
      replies: []
    };
    const all = this.commentsSignal();
    this.commentsSignal.set([comment, ...all]);
    this.saveComments();
    return of(comment);
  }

  addReply(commentId: number, userId: number, userName: string, userAvatar: string, text: string): Observable<ProductComment> {
    const all = this.commentsSignal().map(c => {
      if (c.id === commentId) {
        const reply: CommentReply = {
          id: Date.now(),
          userId,
          userName,
          userAvatar,
          text,
          date: new Date().toISOString()
        };
        return { ...c, replies: [...c.replies, reply] };
      }
      return c;
    });
    this.commentsSignal.set(all);
    this.saveComments();
    return of(all.find(c => c.id === commentId)!);
  }

  deleteComment(commentId: number): void {
    this.commentsSignal.set(this.commentsSignal().filter(c => c.id !== commentId));
    this.saveComments();
  }

  getProductRating(productId: number): { average: number; count: number } {
    const comments = this.commentsSignal().filter(c => c.productId === productId && c.rating > 0);
    if (comments.length === 0) return { average: 0, count: 0 };
    const sum = comments.reduce((total, c) => total + c.rating, 0);
    return { average: Math.round((sum / comments.length) * 10) / 10, count: comments.length };
  }

  private loadComments(): ProductComment[] {
    const saved = localStorage.getItem(this.storageKey);
    return saved ? JSON.parse(saved) : [];
  }

  private saveComments(): void {
    localStorage.setItem(this.storageKey, JSON.stringify(this.commentsSignal()));
  }
}
