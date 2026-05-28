import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminUserService, PendingUser } from '../../../../services/admin-user.service';
import { TranslatePipe } from '../../../../pipes/translate.pipe';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})
export class AdminUsersComponent implements OnInit {
  pendingUsers = signal<PendingUser[]>([]);
  loading = signal(true);
  actionLoading = signal<number | null>(null);
  feedback = signal<{ type: 'success' | 'error'; message: string } | null>(null);
  activeFilter = signal<'todos' | 'pendentes'>('pendentes');

  constructor(private adminUserService: AdminUserService) {}

  ngOnInit(): void {
    this.loadPending();
  }

  loadPending(): void {
    this.loading.set(true);
    this.adminUserService.getPendingUsers().subscribe({
      next: (res) => { this.pendingUsers.set(res.data); this.loading.set(false); },
      error: () => { this.loading.set(false); }
    });
  }

  approveUser(id: number): void {
    this.actionLoading.set(id);
    this.feedback.set(null);
    this.adminUserService.approveUser(id).subscribe({
      next: (res) => {
        this.feedback.set({ type: 'success', message: res.message });
        this.pendingUsers.set(this.pendingUsers().filter(u => u.id !== id));
        this.actionLoading.set(null);
        setTimeout(() => this.feedback.set(null), 3000);
      },
      error: (err) => {
        this.feedback.set({ type: 'error', message: err.error?.error || 'Erro ao aprovar utilizador' });
        this.actionLoading.set(null);
      }
    });
  }

  rejectUser(id: number): void {
    if (!confirm('Tem a certeza que deseja rejeitar este utilizador?')) return;
    this.actionLoading.set(id);
    this.feedback.set(null);
    this.adminUserService.rejectUser(id).subscribe({
      next: (res) => {
        this.feedback.set({ type: 'success', message: res.message });
        this.pendingUsers.set(this.pendingUsers().filter(u => u.id !== id));
        this.actionLoading.set(null);
        setTimeout(() => this.feedback.set(null), 3000);
      },
      error: (err) => {
        this.feedback.set({ type: 'error', message: err.error?.error || 'Erro ao rejeitar utilizador' });
        this.actionLoading.set(null);
      }
    });
  }

  getUserInitial(user: PendingUser): string {
    return (user.nome?.charAt(0) || '?').toUpperCase();
  }

  getTipoLabel(tipo: string): string {
    const labels: Record<string, string> = {
      admin: 'Administrador',
      vendedor: 'Vendedor',
      client: 'Cliente',
      seller: 'Vendedor',
      buyer: 'Comprador'
    };
    return labels[tipo] || tipo;
  }

  formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
}
