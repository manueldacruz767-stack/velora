import { Component, signal } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../services/auth.service';
import { TranslatePipe } from '../../../../pipes/translate.pipe';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, CommonModule, TranslatePipe],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  form;
  loading = signal(false);
  error = signal<string | null>(null);
  showPassword = signal(false);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      senha: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  togglePassword(): void {
    this.showPassword.set(!this.showPassword());
  }

  clearError(): void {
    this.error.set(null);
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);
    const { email, senha } = this.form.value;
    this.authService.login(email!, senha!).subscribe({
      next: () => {
        const role = this.authService.role();
        if (role === 'admin') {
          this.router.navigate(['/admin']);
        } else if (role === 'seller') {
          this.router.navigate(['/seller/painel']);
        } else {
          this.router.navigate(['/']);
        }
      },
      error: (err) => {
        const msg = err.message || '';
        if (msg.includes('Credenciais') || msg.includes('401')) {
          this.error.set('Email ou senha incorrectos');
        } else if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('HttpErrorResponse')) {
          this.error.set('Sem ligação ao servidor. Verifique o XAMPP.');
        } else {
          this.error.set('Erro no servidor. Tente novamente.');
        }
        this.loading.set(false);
      }
    });
  }
}
