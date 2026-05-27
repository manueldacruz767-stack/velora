import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError } from 'rxjs';
import { environment } from '../../environments/environment';
import { User } from '../interfaces/user';

export interface AuthResponse {
  user: User;
  token: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = `${environment.backendUrl}`;
  private tokenKey = 'velora_token';
  private userKey = 'velora_user';

  private tokenSignal = signal<string | null>(this.loadToken());
  private userSignal = signal<User | null>(this.loadUser());

  isLoggedIn = computed(() => this.tokenSignal() !== null);
  currentUser = computed(() => this.userSignal());

  role = computed<'admin' | 'seller' | 'buyer' | null>(() => {
    const user = this.userSignal();
    if (!user) return null;
    if (user.role) return user.role;
    if (user.tipo === 'admin') return 'admin';
    if (user.tipo === 'vendedor' || user.tipo === 'seller') return 'seller';
    return 'buyer';
  });

  token = computed(() => this.tokenSignal());

  constructor(private http: HttpClient) {}

  login(email: string, senha: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, {
      email, senha
    }).pipe(
      tap(res => this.setSession(res)),
      catchError((err) => {
        const msg = err.error?.error || 'Credenciais inválidas';
        throw new Error(msg);
      })
    );
  }

  register(nome: string, email: string, senha: string, tipo?: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, {
      nome, email, senha, tipo: tipo || 'client'
    }).pipe(
      tap(res => this.setSession(res)),
      catchError((err) => {
        const msg = err.error?.error || 'Erro ao registar';
        throw new Error(msg);
      })
    );
  }

  logout(): void {
    this.tokenSignal.set(null);
    this.userSignal.set(null);
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }

  redirectByRole(): void {
    const role = this.role();
    const base = window.location.origin + '/velora';
    switch (role) {
      case 'admin': window.location.href = `${base}/admin`; break;
      case 'seller': window.location.href = `${base}/seller/painel`; break;
      default: window.location.href = `${base}/`;
    }
  }

  private setSession(res: AuthResponse): void {
    this.tokenSignal.set(res.token);
    this.userSignal.set(res.user);
    localStorage.setItem(this.tokenKey, res.token);
    localStorage.setItem(this.userKey, JSON.stringify(res.user));
  }

  private loadToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  private loadUser(): User | null {
    const raw = localStorage.getItem(this.userKey);
    return raw ? JSON.parse(raw) : null;
  }
}
