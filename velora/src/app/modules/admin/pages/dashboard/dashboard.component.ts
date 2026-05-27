import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { ProdutoService } from '../../../../services/produto.service';
import { OrderService, Order } from '../../../../services/order.service';
import { AuthService } from '../../../../services/auth.service';
import { Product } from '../../../../interfaces/product';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  totalProducts = signal(0);
  totalOrders = signal(0);
  totalUsers = signal(0);
  totalRevenue = signal(0);
  products = signal<Product[]>([]);
  orders = signal<Order[]>([]);
  users = signal<any[]>([]);
  loading = signal(true);

  lowStockCount = signal(0);
  activeTab = signal<'products' | 'orders' | 'users'>('products');
  showAddForm = signal(false);
  showAddUserForm = signal(false);
  newProduct = { title: '', price: 0, description: '', category: 'smartphones', thumbnail: '', stock: 10 };
  addingProduct = signal(false);

  editingProductId = signal<number | null>(null);
  editProductData = signal({ title: '', price: 0, description: '', category: '', image: '', stock: 10 });

  editingUserId = signal<number | null>(null);
  newUser = { nome: '', email: '', senha: '', tipo: 'cliente' };
  addingUser = signal(false);

  newProductAuto = { title: '', imageUrl: '' };
  autoFetching = signal(false);

  role = signal<'admin' | 'seller' | 'buyer' | null>(null);

  private sub?: Subscription;

  constructor(
    private produtoService: ProdutoService,
    private orderService: OrderService,
    private authService: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.role.set(this.authService.role());

    this.sub = this.produtoService.getProdutos().subscribe({
      next: (data) => {
        this.products.set(data);
        this.totalProducts.set(data.length);
        this.lowStockCount.set(data.filter(p => (p.stock ?? 0) < 10).length);
        this.loading.set(false);
      }
    });

    this.orderService.getOrders().subscribe((orders: any[]) => {
      this.orders.set(orders as Order[]);
      this.totalOrders.set(orders.length);
      this.totalRevenue.set(orders.reduce((sum: number, o: any) => sum + (o.totalKz || o.total * 850), 0));
    });

    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private loadUsers(): void {
    const registered = JSON.parse(localStorage.getItem('velora_registered_users') || '[]');
    const users = registered.map((r: any) => r.user).filter(Boolean);
    const currentUser = this.authService.currentUser();
    if (currentUser && !users.find((u: any) => u.id === currentUser.id)) {
      users.push(currentUser);
    }
    this.users.set(users);
    this.totalUsers.set(users.length);
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

  getUserInitial(user: any): string {
    return (user.nome?.charAt(0) || '?').toUpperCase();
  }

  switchTab(tab: 'products' | 'orders' | 'users'): void {
    this.activeTab.set(tab);
    this.editingProductId.set(null);
  }

  startEditProduct(product: Product): void {
    this.editingProductId.set(product.id);
    this.editProductData.set({
      title: product.title,
      price: product.price,
      description: product.description,
      category: product.category,
      image: product.thumbnail || '',
      stock: product.stock ?? 10
    });
  }

  saveEditProduct(product: Product): void {
    const data = this.editProductData();
    this.produtoService.atualizarProduto(product.id, {
      title: data.title,
      price: data.price,
      description: data.description,
      category: data.category,
      thumbnail: data.image,
      image: data.image,
      stock: data.stock
    });
    this.editingProductId.set(null);
  }

  cancelEditProduct(): void {
    this.editingProductId.set(null);
  }

  deleteProduct(product: Product): void {
    if (!confirm(`Tem a certeza que deseja eliminar "${product.title}"?`)) return;
    this.produtoService.eliminarProduto(product.id);
  }

  addProduct(): void {
    this.addingProduct.set(true);
    const thumbnail = this.newProduct.thumbnail || this.newProductAuto.imageUrl || 'https://placehold.co/400x400?text=Produto';
    const productData: Omit<Product, 'id'> = {
      title: this.newProduct.title,
      price: this.newProduct.price,
      description: this.newProduct.description,
      category: this.newProduct.category,
      thumbnail: thumbnail,
      image: thumbnail,
      images: [thumbnail],
      rating: { rate: 0, count: 0 },
      stock: this.newProduct.stock,
      brand: '',
      discountPercentage: 0
    };
    this.produtoService.adicionarProduto(productData);
    this.newProduct = { title: '', price: 0, description: '', category: 'smartphones', thumbnail: '', stock: 10 };
    this.newProductAuto = { title: '', imageUrl: '' };
    this.showAddForm.set(false);
    this.addingProduct.set(false);
  }

  updateOrderStatus(order: Order, newStatus: string): void {
    const updated = this.orders().map(o => {
      if (o.id === order.id) {
        return { ...o, status: newStatus as Order['status'] };
      }
      return o;
    });
    this.orders.set(updated);
    localStorage.setItem('velora_orders', JSON.stringify(updated));
  }

  get ordersPerDay(): { day: string; count: number }[] {
    const days: { day: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toDateString();
      const count = this.orders().filter((o: any) => new Date(o.created_at).toDateString() === dayStr).length;
      days.push({
        day: d.toLocaleDateString('pt-PT', { weekday: 'short' }),
        count
      });
    }
    return days;
  }

  get revenueByCategory(): { category: string; revenue: number }[] {
    const map: Record<string, number> = {};
    for (const p of this.products()) {
      const total = p.price * ((p.stock ?? 1) > 0 ? 1 : 0);
      map[p.category] = (map[p.category] || 0) + total;
    }
    return Object.entries(map)
      .map(([category, revenue]) => ({ category: this.getCategoryLabel(category), revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);
  }

  get maxOrdersPerDay(): number {
    return Math.max(...this.ordersPerDay.map(d => d.count), 1);
  }

  get maxRevenueByCategory(): number {
    return Math.max(...this.revenueByCategory.map(d => d.revenue), 1);
  }

  editDataTitle(): string { return this.editProductData().title; }
  editDataCategory(): string { return this.editProductData().category; }
  editDataPrice(): number { return this.editProductData().price; }
  editDataImage(): string { return this.editProductData().image; }
  editDataStock(): number { return this.editProductData().stock; }

  updateEditTitle(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.editProductData.set({ ...this.editProductData(), title: val });
  }

  updateEditCategory(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.editProductData.set({ ...this.editProductData(), category: val });
  }

  updateEditPrice(event: Event): void {
    const val = Number((event.target as HTMLInputElement).value);
    this.editProductData.set({ ...this.editProductData(), price: val });
  }

  updateEditStock(event: Event): void {
    const val = Number((event.target as HTMLInputElement).value);
    this.editProductData.set({ ...this.editProductData(), stock: val });
  }

  autoFetchProduct(): void {
    if (!this.newProductAuto.imageUrl.trim()) return;
    this.autoFetching.set(true);
    const query = this.newProductAuto.title.trim() || 'product';
    this.http.get<any>(`https://dummyjson.com/products/search?q=${encodeURIComponent(query)}&limit=1`).subscribe({
      next: (res) => {
        if (res.products && res.products.length > 0) {
          const p = res.products[0];
          this.newProduct.title = p.title;
          this.newProduct.price = p.price;
          this.newProduct.description = p.description;
          this.newProduct.category = p.category;
          this.newProduct.thumbnail = this.newProductAuto.imageUrl;
        }
        this.autoFetching.set(false);
      },
      error: () => this.autoFetching.set(false)
    });
  }

  addUser(): void {
    if (!this.newUser.nome.trim() || !this.newUser.email.trim() || !this.newUser.senha.trim()) return;
    this.addingUser.set(true);
    const emailLower = this.newUser.email.toLowerCase();
    let detectedRole: string;
    if (emailLower.includes('admin')) {
      detectedRole = 'admin';
    } else if (emailLower.includes('vendedor') || emailLower.includes('seller')) {
      detectedRole = 'seller';
    } else {
      detectedRole = this.newUser.tipo === 'admin' ? 'admin' : this.newUser.tipo;
    }
    const newUserObj = {
      user: {
        id: Date.now(),
        nome: this.newUser.nome.trim(),
        email: this.newUser.email.trim(),
        tipo: detectedRole,
        role: detectedRole
      },
      senha: this.newUser.senha,
      token: btoa(`${this.newUser.email}:${this.newUser.senha}`)
    };
    const registered = JSON.parse(localStorage.getItem('velora_registered_users') || '[]');
    registered.push(newUserObj);
    localStorage.setItem('velora_registered_users', JSON.stringify(registered));
    this.loadUsers();
    this.newUser = { nome: '', email: '', senha: '', tipo: 'cliente' };
    this.addingUser.set(false);
  }

  deleteUser(user: any): void {
    if (!confirm(`Tem a certeza que deseja eliminar "${user.nome}"?`)) return;
    const registered = JSON.parse(localStorage.getItem('velora_registered_users') || '[]');
    const filtered = registered.filter((r: any) => r.user.id !== user.id);
    localStorage.setItem('velora_registered_users', JSON.stringify(filtered));
    this.loadUsers();
  }

  startEditUser(user: any): void {
    this.editingUserId.set(user.id);
  }

  cancelEditUser(): void {
    this.editingUserId.set(null);
  }

  saveEditUser(user: any, newNome: string, newEmail: string, newTipo: string): void {
    const registered = JSON.parse(localStorage.getItem('velora_registered_users') || '[]');
    const emailLower = newEmail.toLowerCase();
    let detectedRole: string;
    if (emailLower.includes('admin')) {
      detectedRole = 'admin';
    } else if (emailLower.includes('vendedor') || emailLower.includes('seller')) {
      detectedRole = 'seller';
    } else {
      detectedRole = newTipo === 'admin' ? 'admin' : 'cliente';
    }
    const updated = registered.map((r: any) => {
      if (r.user.id === user.id) {
        return { ...r, user: { ...r.user, nome: newNome, email: newEmail, tipo: detectedRole, role: detectedRole } };
      }
      return r;
    });
    localStorage.setItem('velora_registered_users', JSON.stringify(updated));
    this.editingUserId.set(null);
    this.loadUsers();
  }
}
