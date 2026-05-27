import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { ProdutoService } from '../../../../services/produto.service';
import { CartService } from '../../../../services/cart.service';
import { ExchangeService } from '../../../../services/exchange.service';
import { ProductCardComponent } from '../../../../components/product-card/product-card.component';
import { TranslatePipe } from '../../../../pipes/translate.pipe';
import { Product } from '../../../../interfaces/product';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductCardComponent, TranslatePipe],
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss'
})
export class ProductsComponent implements OnInit, OnDestroy {
  products = signal<Product[]>([]);
  filteredProducts = signal<Product[]>([]);
  categories = signal<string[]>([]);
  loading = signal(true);
  taxa = signal(850);
  searchQuery = signal('');
  activeCategory = signal('todas');
  sortBy = signal('default');
  currentPage = signal(1);
  totalProducts = signal(0);
  itemsPerPage = 12;

  private sub?: Subscription;
  private querySub?: Subscription;

  constructor(
    private produtoService: ProdutoService,
    private cartService: CartService,
    private exchangeService: ExchangeService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.exchangeService.getTaxa().subscribe(t => this.taxa.set(t));

    this.querySub = this.route.queryParams.subscribe(params => {
      const q = params['q'] || '';
      const category = params['category'] || params['categoria'] || '';
      this.searchQuery.set(q);
      if (category) this.activeCategory.set(category);
      if (!this.loading()) this.aplicarFiltros();
    });

    this.sub = this.produtoService.getProdutos().subscribe({
      next: (data) => {
        this.products.set(data);
        this.totalProducts.set(data.length);
        this.categories.set([...new Set(data.map(p => p.category))]);
        this.loading.set(false);
        this.aplicarFiltros();
      },
      error: () => this.loading.set(false)
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.querySub?.unsubscribe();
  }

  private aplicarFiltros(): void {
    let result = this.products();
    const query = this.searchQuery().trim().toLowerCase();
    if (query) {
      result = result.filter(p =>
        p.title.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        (p.brand && p.brand.toLowerCase().includes(query))
      );
    }
    if (this.activeCategory() !== 'todas') {
      result = result.filter(p => p.category === this.activeCategory());
    }
    this.currentPage.set(1);
    this.filteredProducts.set(result);
    this.applySort();
  }

  filterByCategory(category: string): void {
    this.activeCategory.set(category);
    this.aplicarFiltros();
  }

  onSearch(query: string): void {
    this.searchQuery.set(query.trim());
    this.aplicarFiltros();
  }

  changeSort(sort: string): void {
    this.sortBy.set(sort);
    this.applySort();
  }

  private applySort(): void {
    const sorted = [...this.filteredProducts()];
    switch (this.sortBy()) {
      case 'price-asc': sorted.sort((a, b) => a.price - b.price); break;
      case 'price-desc': sorted.sort((a, b) => b.price - a.price); break;
      case 'name': sorted.sort((a, b) => a.title.localeCompare(b.title)); break;
      case 'rating': sorted.sort((a, b) => (b.rating?.rate ?? 0) - (a.rating?.rate ?? 0)); break;
    }
    this.filteredProducts.set(sorted);
  }

  get paginatedProducts(): Product[] {
    const start = (this.currentPage() - 1) * this.itemsPerPage;
    return this.filteredProducts().slice(start, start + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredProducts().length / this.itemsPerPage);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage.set(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  addToCart(product: Product): void {
    this.cartService.addItem(product);
  }

  formatKz(price: number): string {
    return this.exchangeService.formatarKz(
      this.exchangeService.converterParaKz(price, this.taxa())
    );
  }

  getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      smartphones: 'Smartphones',
      laptops: 'Computadores',
      fragrances: 'Perfumes',
      'home-decoration': 'Decoração',
      'mens-shirts': 'Moda Masculina',
      'womens-dresses': 'Moda Feminina',
      beauty: 'Beleza',
      'skin-care': 'Cuidado de Pele',
      skincare: 'Cuidado de Pele',
      groceries: 'Alimentação',
      furniture: 'Móveis',
      'mobile-accessories': 'Acessórios',
      'mens-watches': 'Relógios',
      'womens-watches': 'Relógios',
      'mens-shoes': 'Calçado',
      'womens-shoes': 'Calçado',
      'womens-bags': 'Bolsas',
      sunglasses: 'Óculos',
      jewellery: 'Jóias',
      'womens-jewellery': 'Jóias',
      tops: 'Tops',
      automotive: 'Automotivo',
      motorcycle: 'Motociclismo',
    };
    return labels[category] || category;
  }
}
