import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  editing = signal(false);
  saved = signal(false);
  editNome = signal('');
  editTelefone = signal('');
  editMorada = signal('');
  editCidade = signal('');
  recentOrders = signal<any[]>([]);

  constructor(
    public authService: AuthService,
    private orderService: OrderService
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (user) {
      this.editNome.set(user.nome);
      this.editTelefone.set((user as any).telefone || '');
      this.editMorada.set((user as any).morada || '');
      this.editCidade.set((user as any).cidade || '');
    }
    this.orderService.getOrders().subscribe((orders: any[]) => {
      this.recentOrders.set(orders.slice(0, 5));
    });
  }

  getUserField(field: string): string {
    const user = this.authService.currentUser();
    if (!user) return '';
    if (field === 'nome') return user.nome;
    if (field === 'email') return user.email;
    return (user as any)[field] || '';
  }

  getOrderTotal(order: any): string {
    const total = order.totalKz || order.total * 850;
    return total.toLocaleString() + ' Kz';
  }

  startEditing(): void {
    this.editing.set(true);
    this.saved.set(false);
  }

  cancelEditing(): void {
    const user = this.authService.currentUser();
    if (user) {
      this.editNome.set(user.nome);
      this.editTelefone.set((user as any).telefone || '');
      this.editMorada.set((user as any).morada || '');
      this.editCidade.set((user as any).cidade || '');
    }
    this.editing.set(false);
  }

  saveProfile(): void {
    const user = this.authService.currentUser();
    if (!user) return;

    const updated = {
      ...user,
      nome: this.editNome(),
      telefone: this.editTelefone(),
      morada: this.editMorada(),
      cidade: this.editCidade()
    };

    localStorage.setItem('velora_user', JSON.stringify(updated));
    (this.authService as any).userSignal.set(updated);

    this.editing.set(false);
    this.saved.set(true);
    setTimeout(() => this.saved.set(false), 3000);
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
}
