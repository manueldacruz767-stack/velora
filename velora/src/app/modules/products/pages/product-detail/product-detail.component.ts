import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ProdutoService } from '../../../../services/produto.service';
import { CartService } from '../../../../services/cart.service';
import { ExchangeService } from '../../../../services/exchange.service';
import { TranslatePipe } from '../../../../pipes/translate.pipe';
import { AuthService } from '../../../../services/auth.service';
import { CommentService } from '../../../../services/comment.service';
import { Product } from '../../../../interfaces/product';
import { ProductComment } from '../../../../interfaces/comment';
import { AvaliacaoService } from '../../../../services/avaliacao.service';
import { Avaliacao } from '../../../../interfaces/avaliacao';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe, FormsModule],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss'
})
export class ProductDetailComponent implements OnInit, OnDestroy {
  product = signal<Product | null>(null);
  relatedProducts = signal<Product[]>([]);
  loading = signal(true);
  addedToCart = signal(false);
  selectedImage = signal(0);
  taxa = signal(850);

  comments = signal<ProductComment[]>([]);
  newCommentText = signal('');
  newCommentRating = signal(5);
  replyToCommentId = signal<number | null>(null);
  replyText = signal('');

  avaliacoes = signal<Avaliacao[]>([]);
  avaliacaoMedia = signal(0);
  avaliacaoTotal = signal(0);
  newAvaliacaoRating = signal(5);
  newAvaliacaoText = signal('');
  enviandoAvaliacao = signal(false);
  avaliacaoMsg = signal('');

  private sub?: Subscription;
  private currentId = 0;

  constructor(
    private route: ActivatedRoute,
    private produtoService: ProdutoService,
    private cartService: CartService,
    public exchangeService: ExchangeService,
    public authService: AuthService,
    private commentService: CommentService,
    private avaliacaoService: AvaliacaoService
  ) {}

  ngOnInit(): void {
    this.exchangeService.getTaxa().subscribe(t => this.taxa.set(t));
    this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));
      if (id) {
        this.currentId = id;
        this.sub?.unsubscribe();
        this.sub = this.produtoService.getProdutos().subscribe({
          next: (data) => {
            const found = data.find(p => p.id === id);
            if (found) {
              this.product.set(found);
              this.loading.set(false);
              this.selectedImage.set(0);
              this.relatedProducts.set(
                data.filter(p => p.category === found.category && p.id !== id).slice(0, 4)
              );
              this.loadComments(id);
              this.loadAvaliacoes(id);
            }
          }
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  addToCart(): void {
    const p = this.product();
    if (!p) return;
    this.cartService.addItem(p);
    this.addedToCart.set(true);
    setTimeout(() => this.addedToCart.set(false), 1500);
  }

  formatKz(price: number): string {
    return this.exchangeService.formatarKz(
      this.exchangeService.converterParaKz(price, this.taxa())
    );
  }

  getStars(rate: number): { filled: boolean }[] {
    const rounded = Math.round(rate);
    return Array(5).fill(0).map((_, i) => ({ filled: i < rounded }));
  }

  private loadComments(productId: number): void {
    this.commentService.getComments(productId).subscribe(c => this.comments.set(c));
  }

  private loadAvaliacoes(productId: number): void {
    if (!productId) return;
    this.avaliacaoService.getByProduct(productId).subscribe({
      next: (res) => {
        this.avaliacoes.set(res.data);
        this.avaliacaoMedia.set(res.stats.media);
        this.avaliacaoTotal.set(res.stats.total);
      },
      error: () => {}
    });
  }

  submitComment(): void {
    const p = this.product();
    const user = this.authService.currentUser();
    if (!p || !user || !this.newCommentText().trim()) return;
    this.commentService.addComment(
      p.id, user.id, user.nome, '',
      this.newCommentText().trim(), this.newCommentRating()
    ).subscribe(() => {
      this.loadComments(p.id);
      this.newCommentText.set('');
      this.newCommentRating.set(5);
    });
  }

  submitReply(commentId: number): void {
    const user = this.authService.currentUser();
    if (!user || !this.replyText().trim()) return;
    this.commentService.addReply(
      commentId, user.id, user.nome, '',
      this.replyText().trim()
    ).subscribe(() => {
      const p = this.product();
      if (p) this.loadComments(p.id);
      this.replyToCommentId.set(null);
      this.replyText.set('');
    });
  }

  setRating(star: number): void {
    this.newCommentRating.set(star);
  }

  canReply(): boolean {
    return !!this.authService.currentUser();
  }

  setAvaliacaoRating(star: number): void {
    this.newAvaliacaoRating.set(star);
  }

  submitAvaliacao(productId: number): void {
    if (!this.newAvaliacaoText().trim()) return;
    this.enviandoAvaliacao.set(true);
    this.avaliacaoService.create(productId, this.newAvaliacaoRating(), this.newAvaliacaoText().trim()).subscribe({
      next: () => {
        this.loadAvaliacoes(productId);
        this.newAvaliacaoText.set('');
        this.newAvaliacaoRating.set(5);
        this.enviandoAvaliacao.set(false);
        this.avaliacaoMsg.set('Avaliação enviada com sucesso!');
        setTimeout(() => this.avaliacaoMsg.set(''), 3000);
      },
      error: (err) => {
        this.enviandoAvaliacao.set(false);
        this.avaliacaoMsg.set(err.error?.error || 'Erro ao enviar avaliação');
        setTimeout(() => this.avaliacaoMsg.set(''), 3000);
      }
    });
  }

  getAvaliacaoStars(rate: number): { filled: boolean }[] {
    const rounded = Math.round(rate);
    return Array(5).fill(0).map((_, i) => ({ filled: i < rounded }));
  }
}
