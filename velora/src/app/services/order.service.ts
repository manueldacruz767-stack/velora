import { Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_nome: string;
  quantidade: number;
  preco: number;
}

export interface Order {
  id: number;
  user_id: number;
  total: number;
  status: 'pendente' | 'pago' | 'processando' | 'enviado' | 'entregue' | 'cancelado';
  created_at: string;
  items: OrderItem[];
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private storageKey = 'velora_orders';
  private ordersSignal = signal<Order[]>(this.loadOrders());

  getOrders(): Observable<Order[]> {
    return of(this.ordersSignal());
  }

  createOrder(
    items: { product_id: number; product_nome: string; quantidade: number; preco: number }[],
    total: number
  ): Observable<Order> {
    const newOrder: Order = {
      id: Date.now(),
      user_id: 1,
      total,
      status: 'pendente',
      created_at: new Date().toISOString(),
      items: items.map((item, i) => ({
        id: i + 1,
        order_id: Date.now(),
        product_id: item.product_id,
        product_nome: item.product_nome,
        quantidade: item.quantidade,
        preco: item.preco
      }))
    };
    const current = this.ordersSignal();
    this.ordersSignal.set([newOrder, ...current]);
    this.saveOrders();
    return of(newOrder);
  }

  private loadOrders(): Order[] {
    const saved = localStorage.getItem(this.storageKey);
    return saved ? JSON.parse(saved) : [];
  }

  private saveOrders(): void {
    localStorage.setItem(this.storageKey, JSON.stringify(this.ordersSignal()));
  }
}
