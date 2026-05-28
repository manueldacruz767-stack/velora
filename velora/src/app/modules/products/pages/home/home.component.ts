import { Component, OnInit, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { ProdutoService } from '../../../../services/produto.service';
import { CartService } from '../../../../services/cart.service';
import { ExchangeService } from '../../../../services/exchange.service';
import { TranslatePipe } from '../../../../pipes/translate.pipe';
import { FadeInDirective } from '../../../../directives/fade-in.directive';
import { ProductCardComponent } from '../../../../components/product-card/product-card.component';
import { Product } from '../../../../interfaces/product';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe, FadeInDirective, ProductCardComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, OnDestroy {
  products = signal<Product[]>([]);
  loading = signal(true);
  taxa = signal(850);
  addedProductId = signal<number | null>(null);
  heroProducts = signal<Product[]>([]);
  currentHeroIndex = signal(0);
  isHeroPaused = signal(false);

  categoryData = signal<{ category: string; count: number; image: string; label: string }[]>([]);
  categoryCarousels = signal<{ category: string; products: Product[] }[]>([]);
  carouselIndices: Record<string, number | undefined> = {};
  private carouselTimer: ReturnType<typeof setInterval> | null = null;
  private categoryTimers: Record<string, ReturnType<typeof setInterval>> = {};
  private sub?: Subscription;

  categoryLabels: Record<string, string> = {
    smartphones: 'Smartphones',
    laptops: 'Computadores',
    tablets: 'Tablets',
    'mobile-accessories': 'Acessórios Mobile',
    fragrances: 'Perfumes',
    skincare: 'Cuidado de Pele',
    beauty: 'Beleza',
    'mens-shirts': 'Camisas',
    'womens-dresses': 'Vestidos',
    'mens-shoes': 'Calçado Masculino',
    'womens-shoes': 'Calçado Feminino',
    'womens-bags': 'Malas',
    'mens-watches': 'Relógios Masculinos',
    'womens-watches': 'Relógios Femininos',
    sunglasses: 'Óculos de Sol',
    jewellery: 'Jóias',
    'home-decoration': 'Decoração',
    furniture: 'Móveis',
    'kitchen-accessories': 'Cozinha',
    groceries: 'Alimentação',
    'sports-accessories': 'Desporto',
    vehicle: 'Automóvel',
    motorcycle: 'Motociclismo',
  };

  constructor(
    private produtoService: ProdutoService,
    private cartService: CartService,
    private exchangeService: ExchangeService
  ) {}

  ngOnInit(): void {
    this.exchangeService.getTaxa().subscribe(t => this.taxa.set(t));

    this.sub = this.produtoService.getProdutos().subscribe({
      next: (data) => {
        this.products.set(data);
        const heroItems = data.slice(0, 6);
        this.heroProducts.set(heroItems);
        this.updateCategories(data);
        this.loading.set(false);
        this.startCarousel();
      },
      error: () => this.loading.set(false)
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.stopCarousel();
    this.stopAllCategoryCarousels();
  }

  private updateCategories(allProducts: Product[]): void {
    const allCats = [
      'smartphones', 'laptops', 'tablets', 'mobile-accessories',
      'fragrances', 'skincare', 'beauty',
      'mens-shirts', 'womens-dresses', 'mens-shoes', 'womens-shoes', 'womens-bags',
      'mens-watches', 'womens-watches', 'sunglasses', 'jewellery',
      'home-decoration', 'furniture', 'kitchen-accessories', 'groceries',
      'sports-accessories', 'vehicle', 'motorcycle'
    ];

    const data = allCats.map(cat => {
      const catProducts = allProducts.filter(p => p.category === cat);
      return {
        category: cat,
        count: catProducts.length,
        image: catProducts[0]?.thumbnail || '',
        label: this.categoryLabels[cat] || cat
      };
    }).filter(c => c.count > 0);
    this.categoryData.set(data);

    const availableCats = [...new Set(allProducts.map(p => p.category))];
    const carousels = availableCats
      .map(cat => ({ category: cat, products: allProducts.filter(p => p.category === cat).slice(0, 8) }))
      .filter(cat => cat.products.length > 0);
    this.categoryCarousels.set(carousels);
    carousels.forEach(cat => {
      this.carouselIndices[cat.category] = 0;
    });
    this.startCategoryCarousels(carousels);
  }

  private startCarousel(): void {
    this.stopCarousel();
    this.carouselTimer = setInterval(() => {
      if (!this.isHeroPaused()) {
        this.currentHeroIndex.set((this.currentHeroIndex() + 1) % this.heroProducts().length);
      }
    }, 4000);
  }

  pauseCarousel(): void {
    this.isHeroPaused.set(true);
  }

  resumeCarousel(): void {
    this.isHeroPaused.set(false);
  }

  stopCarousel(): void {
    if (this.carouselTimer) {
      clearInterval(this.carouselTimer);
      this.carouselTimer = null;
    }
  }

  goToSlide(index: number): void {
    this.currentHeroIndex.set(index);
  }

  private startCategoryCarousels(data: { category: string; products: Product[] }[]): void {
    for (const item of data) {
      if (item.products.length <= 4) continue;
      const timer = setInterval(() => {
        const current = this.carouselIndices[item.category] ?? 0;
        const max = Math.max(0, item.products.length - 4);
        this.carouselIndices[item.category] = current >= max ? 0 : current + 1;
        this.carouselIndices = { ...this.carouselIndices };
      }, 5000);
      this.categoryTimers[item.category] = timer;
    }
  }

  private stopAllCategoryCarousels(): void {
    Object.values(this.categoryTimers).forEach(t => clearInterval(t));
    this.categoryTimers = {};
  }

  prevCategory(category: string): void {
    const item = this.categoryCarousels().find(c => c.category === category);
    if (!item) return;
    const max = Math.max(0, item.products.length - 4);
    const current = this.carouselIndices[category] ?? 0;
    this.carouselIndices[category] = current <= 0 ? max : current - 1;
    this.carouselIndices = { ...this.carouselIndices };
  }

  nextCategory(category: string): void {
    const item = this.categoryCarousels().find(c => c.category === category);
    if (!item) return;
    const max = Math.max(0, item.products.length - 4);
    const current = this.carouselIndices[category] ?? 0;
    this.carouselIndices[category] = current >= max ? 0 : current + 1;
    this.carouselIndices = { ...this.carouselIndices };
  }

  addToCart(product: Product): void {
    this.cartService.addItem(product);
    this.addedProductId.set(product.id);
    setTimeout(() => this.addedProductId.set(null), 1500);
  }

  formatKz(price: number): string {
    return this.exchangeService.formatarKz(
      this.exchangeService.converterParaKz(price, this.taxa())
    );
  }

  getCategoryLabel(category: string): string {
    return this.categoryLabels[category] || category;
  }

  getRatingStars(rating: number): number[] {
    return [1, 2, 3, 4, 5].map(i => i);
  }

  hasStar(rating: number, star: number): boolean {
    return star <= Math.round(rating);
  }
}
