import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../../../services/order.service';

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sales.component.html',
  styleUrl: './sales.component.scss'
})
export class SalesComponent implements OnInit {
  orders: any[] = [];
  filteredOrders: any[] = [];
  totalRevenue = signal(0);
  totalOrders = signal(0);
  deliveredCount = signal(0);
  processingCount = signal(0);
  statusFilter = signal('todos');
  searchTerm = signal('');

  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    this.orderService.getOrders().subscribe((orders: any[]) => {
      this.orders = orders;
      this.filteredOrders = [...this.orders];
      this.totalOrders.set(this.orders.length);
      this.totalRevenue.set(this.orders.reduce((sum: number, o: any) => sum + (o.totalKz || o.total * 850), 0));
      this.deliveredCount.set(this.orders.filter((o: any) => o.status === 'entregue').length);
      this.processingCount.set(this.orders.filter((o: any) => o.status === 'pendente' || o.status === 'confirmado').length);
    });
  }

  onStatusFilter(status: string): void {
    this.statusFilter.set(status);
    this.applyFilters();
  }

  onSearch(term: string): void {
    this.searchTerm.set(term);
    this.applyFilters();
  }

  private applyFilters(): void {
    let result = this.orders;

    if (this.statusFilter() !== 'todos') {
      result = result.filter((o: any) => o.status === this.statusFilter());
    }

    const term = this.searchTerm().toLowerCase();
    if (term) {
      result = result.filter((o: any) =>
        String(o.id).includes(term) ||
        (o.items || []).some((item: any) =>
          (item.product?.title || '').toLowerCase().includes(term)
        )
      );
    }

    this.filteredOrders = result;
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      pendente: 'status-pending',
      confirmado: 'status-confirmed',
      entregue: 'status-delivered',
      cancelado: 'status-canceled'
    };
    return map[status] || '';
  }

  formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  updateOrderStatus(order: any, newStatus: string): void {
    const updated = this.orders.map((o: any) => {
      if (o.id === order.id) {
        return { ...o, status: newStatus };
      }
      return o;
    });
    this.orders = updated;
    this.applyFilters();
    this.totalRevenue.set(this.orders.reduce((sum: number, o: any) => sum + (o.totalKz || o.total * 850), 0));
    this.deliveredCount.set(this.orders.filter((o: any) => o.status === 'entregue').length);
    this.processingCount.set(this.orders.filter((o: any) => o.status === 'pendente' || o.status === 'confirmado').length);
    localStorage.setItem('velora_orders', JSON.stringify(updated));
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pendente: 'Pendente', confirmado: 'Confirmado',
      entregue: 'Entregue', cancelado: 'Cancelado'
    };
    return labels[status] || status;
  }
}
