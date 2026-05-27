import { Injectable, signal, computed } from '@angular/core';
import { CartItem } from '../interfaces/cart-item';
import { Product } from '../interfaces/product';

@Injectable({ providedIn: 'root' })
export class CartService {
  private items = signal<CartItem[]>(this.loadCart());

  totalItems = computed(() =>
    this.items().reduce((acc, item) => acc + item.quantidade, 0)
  );

  totalPrice = computed(() =>
    this.items().reduce((acc, item) => acc + (item.product.price * item.quantidade), 0)
  );

  getItems() { return this.items; }

  addItem(product: Product): void {
    const current = this.items();
    const exists = current.find(i => i.product.id === product.id);
    if (exists) {
      this.items.set(current.map(i =>
        i.product.id === product.id ? { ...i, quantidade: i.quantidade + 1 } : i
      ));
    } else {
      this.items.set([...current, { product, quantidade: 1 }]);
    }
    this.saveCart();
  }

  removeItem(productId: number): void {
    this.items.set(this.items().filter(i => i.product.id !== productId));
    this.saveCart();
  }

  updateQuantidade(productId: number, quantidade: number): void {
    if (quantidade <= 0) { this.removeItem(productId); return; }
    this.items.set(this.items().map(i =>
      i.product.id === productId ? { ...i, quantidade } : i
    ));
    this.saveCart();
  }

  clearCart(): void {
    this.items.set([]);
    localStorage.removeItem('velora_cart');
  }

  private saveCart(): void {
    localStorage.setItem('velora_cart', JSON.stringify(this.items()));
  }

  private loadCart(): CartItem[] {
    const saved = localStorage.getItem('velora_cart');
    return saved ? JSON.parse(saved) : [];
  }
}
