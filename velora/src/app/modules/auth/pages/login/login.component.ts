import { Component, signal } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, CommonModule],
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
        this.error.set(err.error?.error || 'Erro ao entrar. Tente novamente.');
        this.loading.set(false);
      }
    });
  }
}
