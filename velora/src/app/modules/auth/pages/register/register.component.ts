import { Component, signal, computed } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../services/auth.service';
import { TranslatePipe } from '../../../../pipes/translate.pipe';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, CommonModule, TranslatePipe],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  form;
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal(false);
  showSenha = signal(false);
  showConfirmSenha = signal(false);
  aceiteTermos = signal(false);

  detectedRole = computed(() => {
    const email = this.form.get('email')?.value || '';
    const e = email.toLowerCase();
    if (e.includes('admin')) return { role: 'admin', label: 'Administrador' };
    if (e.includes('vendedor') || e.includes('seller')) return { role: 'seller', label: 'Vendedor' };
    return { role: 'buyer', label: 'Comprador' };
  });

  passwordStrength = computed(() => {
    const senha = this.form.get('senha')?.value || '';
    let score = 0;
    if (senha.length >= 6) score += 1;
    if (senha.length >= 10) score += 1;
    if (/[A-Z]/.test(senha)) score += 1;
    if (/[a-z]/.test(senha)) score += 1;
    if (/[0-9]/.test(senha)) score += 1;
    if (/[^A-Za-z0-9]/.test(senha)) score += 1;
    return score;
  });

  passwordLabel = computed(() => {
    const s = this.passwordStrength();
    if (s <= 2) return { text: 'auth.senha_fraca', class: 'weak' };
    if (s <= 3) return { text: 'auth.senha_media', class: 'medium' };
    if (s <= 4) return { text: 'auth.senha_forte', class: 'strong' };
    return { text: 'auth.senha_muito_forte', class: 'very-strong' };
  });

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      senha: ['', [Validators.required, Validators.minLength(6)]],
      confirmSenha: ['', [Validators.required]]
    }, { validators: this.senhasCoincidem });
}

  private senhasCoincidem(group: AbstractControl): ValidationErrors | null {
    const senha = group.get('senha')?.value;
    const confirm = group.get('confirmSenha')?.value;
    return senha === confirm ? null : { naoCoincidem: true };
  }

  clearError(): void {
    this.error.set(null);
  }

  toggleSenha(): void {
    this.showSenha.set(!this.showSenha());
  }

  toggleConfirmSenha(): void {
    this.showConfirmSenha.set(!this.showConfirmSenha());
  }

  onSubmit(): void {
    if (this.form.invalid || !this.aceiteTermos()) return;
    this.loading.set(true);
    this.error.set(null);
    const { nome, email, senha } = this.form.value;
    this.authService.register(nome!, email!, senha!).subscribe({
      next: () => {
        this.success.set(true);
        this.loading.set(false);
        const role = this.authService.role();
        setTimeout(() => {
          if (role === 'admin') {
            this.router.navigate(['/admin']);
          } else if (role === 'seller') {
            this.router.navigate(['/seller/painel']);
          } else {
            this.router.navigate(['/']);
          }
        }, 1000);
      },
      error: (err) => {
        const msg = err.message || '';
        if (msg.includes('Email já registado') || msg.includes('já registado')) {
          this.error.set('Este email já está registado');
        } else if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('HttpErrorResponse')) {
          this.error.set('Sem ligação ao servidor. Verifique o XAMPP.');
        } else if (msg.includes('obrigatórios') || msg.includes('obrigatorio')) {
          this.error.set('Preencha todos os campos obrigatórios');
        } else {
          this.error.set('Erro no servidor. Tente novamente.');
        }
        this.loading.set(false);
      }
    });
  }
}