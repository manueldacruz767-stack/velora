import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../../pipes/translate.pipe';
import { SellerService, WalletData } from '../../../../services/seller.service';
import { Product } from '../../../../interfaces/product';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-seller-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslatePipe],
  templateUrl: './panel.component.html',
  styleUrl: './panel.component.scss'
})
export class SellerPanelComponent implements OnInit {
  wallet = signal<WalletData | null>(null);
  products = signal<Product[]>([]);
  loading = signal(true);
  editingStock = signal<number | null>(null);
  stockValue = signal(0);
  saving = signal<number | null>(null);
  uploadingImg = signal<number | null>(null);
  message = signal('');
  messageType = signal<'success' | 'error'>('success');

  activeTab = signal<'wallet' | 'products'>('wallet');

  constructor(private sellerService: SellerService) {}

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loading.set(true);
    this.sellerService.getWallet().subscribe({
      next: (res) => {
        this.wallet.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
    this.sellerService.getProducts().subscribe({
      next: (res) => {
        this.products.set(res.data as Product[]);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  startEditStock(product: Product): void {
    this.editingStock.set(product.id);
    this.stockValue.set(product.stock ?? 0);
  }

  cancelEditStock(): void {
    this.editingStock.set(null);
  }

  adjustStock(delta: number): void {
    this.stockValue.set(Math.max(0, this.stockValue() + delta));
  }

  saveStock(productId: number): void {
    this.saving.set(productId);
    this.sellerService.updateStock(productId, this.stockValue()).subscribe({
      next: (res) => {
        this.products.update(list => list.map(p =>
          p.id === productId ? { ...p, stock: res.data.stock } : p
        ));
        this.editingStock.set(null);
        this.saving.set(null);
        this.showMessage('Stock actualizado com sucesso', 'success');
      },
      error: (err) => {
        this.saving.set(null);
        this.showMessage(err.error?.error || 'Erro ao actualizar stock', 'error');
      }
    });
  }

  onImageSelected(event: Event, productId: number): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.uploadingImg.set(productId);
    this.sellerService.uploadImage(productId, file).subscribe({
      next: (res) => {
        this.products.update(list => list.map(p =>
          p.id === productId ? { ...p, imagem_url: res.data.imagem_url } : p
        ));
        this.uploadingImg.set(null);
        this.showMessage('Imagem actualizada com sucesso', 'success');
      },
      error: (err) => {
        this.uploadingImg.set(null);
        this.showMessage(err.error?.error || 'Erro ao enviar imagem', 'error');
      }
    });
  }

  getImageUrl(product: Product): string {
    if (product.imagem_url) return product.imagem_url;
    if (product.thumbnail) return product.thumbnail;
    return product.image || 'https://placehold.co/400x400?text=Sem+Imagem';
  }

  private showMessage(msg: string, type: 'success' | 'error'): void {
    this.message.set(msg);
    this.messageType.set(type);
    setTimeout(() => this.message.set(''), 3000);
  }

  getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      smartphones: 'Smartphones', laptops: 'Computadores', fragrances: 'Perfumes',
      'home-decoration': 'Decoração', 'mens-shirts': 'Moda Masculina',
      'womens-dresses': 'Moda Feminina', beauty: 'Beleza', 'skin-care': 'Cuidado de Pele',
      skincare: 'Cuidado de Pele', groceries: 'Alimentação', furniture: 'Móveis',
      'mobile-accessories': 'Acessórios', 'mens-watches': 'Relógios',
      'womens-watches': 'Relógios', 'mens-shoes': 'Calçado', 'womens-shoes': 'Calçado',
      'womens-bags': 'Bolsas', sunglasses: 'Óculos', jewellery: 'Jóias',
      'womens-jewellery': 'Jóias', tops: 'Tops', automotive: 'Automotivo',
      motorcycle: 'Motociclismo'
    };
    return labels[category] || category;
  }
}
