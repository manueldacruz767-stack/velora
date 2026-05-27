import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../services/auth.service';
import { OrderService } from '../../../../services/order.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  editing = signal(false);
  saved = signal(false);
  editNome = signal('');
  editEmail = signal('');
  editTelefone = signal('');
  editMorada = signal('');
  editCidade = signal('Luanda');
  recentOrders = signal<any[]>([]);
  showPasswordForm = signal(false);
  currentPassword = signal('');
  newPassword = signal('');
  confirmPassword = signal('');
  passwordError = signal('');
  passwordSuccess = signal(false);
  notifications = signal(true);
  promoEmails = signal(false);

  constructor(
    public authService: AuthService,
    private orderService: OrderService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (user) {
      this.editNome.set(user.nome);
      this.editEmail.set(user.email);
      this.editTelefone.set((user as any).telefone || '');
      this.editMorada.set((user as any).morada || '');
      this.editCidade.set((user as any).cidade || 'Luanda');
    }
    this.orderService.getOrders().subscribe((orders: any[]) => {
      this.recentOrders.set(orders.slice(0, 3));
    });
  }

  get initials(): string {
    const user = this.authService.currentUser();
    if (!user) return '?';
    return user.nome.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
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
      this.editEmail.set(user.email);
      this.editTelefone.set((user as any).telefone || '');
      this.editMorada.set((user as any).morada || '');
      this.editCidade.set((user as any).cidade || 'Luanda');
    }
    this.editing.set(false);
  }

  saveProfile(): void {
    const user = this.authService.currentUser();
    if (!user) return;

    const updated = {
      ...user,
      nome: this.editNome(),
      email: this.editEmail(),
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

  changePassword(): void {
    this.passwordError.set('');
    this.passwordSuccess.set(false);

    if (this.newPassword() !== this.confirmPassword()) {
      this.passwordError.set('As palavras-passe não coincidem.');
      return;
    }
    if (this.newPassword().length < 6) {
      this.passwordError.set('A palavra-passe deve ter pelo menos 6 caracteres.');
      return;
    }

    this.currentPassword.set('');
    this.newPassword.set('');
    this.confirmPassword.set('');
    this.passwordSuccess.set(true);
    this.showPasswordForm.set(false);
    setTimeout(() => this.passwordSuccess.set(false), 3000);
  }

  toggleNotifications(): void {
    this.notifications.set(!this.notifications());
    localStorage.setItem('velora_notifications', JSON.stringify(this.notifications()));
  }

  togglePromoEmails(): void {
    this.promoEmails.set(!this.promoEmails());
    localStorage.setItem('velora_promo_emails', JSON.stringify(this.promoEmails()));
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
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
