export interface User {
  id: number;
  nome: string;
  email: string;
  tipo: 'admin' | 'seller' | 'buyer' | 'cliente' | 'vendedor';
  role?: 'admin' | 'seller' | 'buyer';
  telefone?: string;
  morada?: string;
  cidade?: string;
  avatar?: string;
}
