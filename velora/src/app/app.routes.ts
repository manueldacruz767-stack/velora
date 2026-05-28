import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { SellerGuard } from './guards/seller.guard';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./modules/products/pages/home/home.component').then(m => m.HomeComponent) },
  { path: 'produto/:id', loadComponent: () => import('./modules/products/pages/product-detail/product-detail.component').then(m => m.ProductDetailComponent) },
  { path: 'produtos', loadComponent: () => import('./modules/products/pages/products/products.component').then(m => m.ProductsComponent) },
  { path: 'colecao', loadComponent: () => import('./modules/products/pages/products/products.component').then(m => m.ProductsComponent) },
  { path: 'carrinho', loadComponent: () => import('./modules/cart/pages/cart/cart.component').then(m => m.CartComponent), canActivate: [AuthGuard] },
  { path: 'checkout', loadComponent: () => import('./modules/cart/pages/checkout/checkout.component').then(m => m.CheckoutComponent), canActivate: [AuthGuard] },
  { path: 'checkout/success/:id', loadComponent: () => import('./modules/cart/pages/checkout-success/checkout-success.component').then(m => m.CheckoutSuccessComponent), canActivate: [AuthGuard] },
  { path: 'pedidos', loadComponent: () => import('./modules/orders/pages/orders/orders.component').then(m => m.OrdersComponent), canActivate: [AuthGuard] },
  { path: 'login', loadComponent: () => import('./modules/auth/pages/login/login.component').then(m => m.LoginComponent) },
  { path: 'sobre', loadComponent: () => import('./modules/info/pages/sobre/sobre.component').then(m => m.SobreComponent) },
  { path: 'politica', loadComponent: () => import('./modules/info/pages/politica/politica.component').then(m => m.PoliticaComponent) },
  { path: 'registo', loadComponent: () => import('./modules/auth/pages/register/register.component').then(m => m.RegisterComponent) },
  { path: 'perfil', loadComponent: () => import('./modules/auth/pages/profile/profile.component').then(m => m.ProfileComponent), canActivate: [AuthGuard] },
  {
    path: 'admin',
    canActivate: [AdminGuard],
    loadComponent: () => import('./modules/admin/admin.component').then(m => m.AdminComponent),
    children: [
      { path: '', loadComponent: () => import('./modules/admin/pages/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'produtos', loadComponent: () => import('./modules/admin/pages/products/products.component').then(m => m.AdminProductsComponent) },
      { path: 'vendas', loadComponent: () => import('./modules/admin/pages/sales/sales.component').then(m => m.SalesComponent) },
      { path: 'utilizadores', loadComponent: () => import('./modules/admin/pages/users/users.component').then(m => m.AdminUsersComponent) }
    ]
  },
  {
    path: 'seller',
    canActivate: [SellerGuard],
    loadComponent: () => import('./modules/admin/admin.component').then(m => m.AdminComponent),
    children: [
      { path: '', redirectTo: 'painel', pathMatch: 'full' },
      { path: 'painel', loadComponent: () => import('./modules/admin/pages/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'produtos', loadComponent: () => import('./modules/admin/pages/products/products.component').then(m => m.AdminProductsComponent) }
    ]
  },
  { path: '**', redirectTo: '' }
];
