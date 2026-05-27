import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ProdutoService } from '../../../../services/produto.service';
import { ExchangeService } from '../../../../services/exchange.service';
import { Product } from '../../../../interfaces/product';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss'
})
export class AdminProductsComponent implements OnInit, OnDestroy {
  products = signal<Product[]>([]);
  filteredProducts = signal<Product[]>([]);
  loading = signal(true);
  searchTerm = signal('');
  filterStock = signal('todos');

  showModal = signal(false);
  editingProduct = signal<Product | null>(null);
  formData: Partial<Product> = {};
  deletingId = signal<number | null>(null);

  private sub?: Subscription;

  constructor(
    private produtoService: ProdutoService,
    private exchangeService: ExchangeService
  ) {}

  ngOnInit(): void {
    this.sub = this.produtoService.getProdutos().subscribe({
      next: (data) => {
        this.products.set(data);
        this.applyFilters();
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  onSearch(term: string): void {
    this.searchTerm.set(term);
    this.applyFilters();
  }

  onFilterStock(filter: string): void {
    this.filterStock.set(filter);
    this.applyFilters();
  }

  private applyFilters(): void {
    let result = this.products();
    const term = this.searchTerm().toLowerCase();
    if (term) {
      result = result.filter(p =>
        p.title.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term) ||
        (p.brand && p.brand.toLowerCase().includes(term))
      );
    }
    if (this.filterStock() === 'baixo') {
      result = result.filter(p => (p.stock ?? 0) < 10);
    } else if (this.filterStock() === 'disponivel') {
      result = result.filter(p => (p.stock ?? 0) >= 10);
    }
    this.filteredProducts.set(result);
  }

  openAdd(): void {
    this.editingProduct.set(null);
    this.formData = {
      title: '',
      price: 0,
      description: '',
      category: '',
      brand: '',
      stock: 10,
      discountPercentage: 0,
      image: 'https://placehold.co/400x400?text=Novo+Produto',
      thumbnail: 'https://placehold.co/400x400?text=Novo+Produto'
    };
    this.showModal.set(true);
  }

  openEdit(product: Product): void {
    this.editingProduct.set(product);
    this.formData = {
      title: product.title,
      price: product.price,
      description: product.description,
      category: product.category,
      brand: product.brand,
      stock: product.stock,
      discountPercentage: product.discountPercentage,
      image: product.image || product.thumbnail,
      thumbnail: product.thumbnail
    };
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingProduct.set(null);
    this.formData = {};
  }

  salvarProduto(): void {
    if (!this.formData.title || !this.formData.price) return;
    const productData: Omit<Product, 'id'> = {
      title: this.formData.title!,
      price: this.formData.price!,
      description: this.formData.description || '',
      category: this.formData.category || 'geral',
      brand: this.formData.brand || '',
      stock: this.formData.stock ?? 10,
      discountPercentage: this.formData.discountPercentage ?? 0,
      image: this.formData.image || this.formData.thumbnail || 'https://placehold.co/400x400?text=Produto',
      thumbnail: this.formData.thumbnail || this.formData.image || 'https://placehold.co/400x400?text=Produto',
      images: this.formData.image ? [this.formData.image] : [],
      rating: { rate: 0, count: 0 }
    };
    if (this.editingProduct()) {
      this.produtoService.atualizarProduto(this.editingProduct()!.id, productData);
    } else {
      this.produtoService.adicionarProduto(productData);
    }
    this.closeModal();
  }

  confirmDelete(id: number): void {
    this.deletingId.set(id);
  }

  cancelDelete(): void {
    this.deletingId.set(null);
  }

  eliminarProduto(id: number): void {
    this.produtoService.eliminarProduto(id);
    this.deletingId.set(null);
  }

  getStockClass(stock: number | undefined): string {
    if ((stock ?? 0) <= 0) return 'stock-out';
    if ((stock ?? 0) < 10) return 'stock-low';
    return 'stock-ok';
  }

  getStockLabel(stock: number | undefined): string {
    if ((stock ?? 0) <= 0) return 'Sem stock';
    if ((stock ?? 0) < 10) return 'Stock baixo';
    return `${stock} unidades`;
  }

  getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      smartphones: 'Smartphones', laptops: 'Computadores', fragrances: 'Perfumes',
      'home-decoration': 'Decoração', 'mens-shirts': 'Moda Masculina', 'womens-dresses': 'Moda Feminina',
      beauty: 'Beleza', 'skin-care': 'Cuidado de Pele', skincare: 'Cuidado de Pele',
      groceries: 'Alimentação', furniture: 'Móveis', 'mobile-accessories': 'Acessórios',
      'mens-watches': 'Relógios', 'womens-watches': 'Relógios', 'mens-shoes': 'Calçado',
      'womens-shoes': 'Calçado', 'womens-bags': 'Bolsas', sunglasses: 'Óculos',
      jewellery: 'Jóias', 'womens-jewellery': 'Jóias', tops: 'Tops',
      automotive: 'Automotivo', motorcycle: 'Motociclismo',
    };
    return labels[category] || category;
  }

  formatKz(price: number): string {
    return this.exchangeService.formatarKz(
      this.exchangeService.converterParaKz(price, 850)
    );
  }
}
