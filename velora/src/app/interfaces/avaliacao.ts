export interface Avaliacao {
    id: number;
    product_id: number;
    user_id: number;
    user_nome: string;
    rating: number;
    comentario: string;
    created_at: string;
}

export interface AvaliacaoStats {
    media: number;
    total: number;
}

export interface AvaliacaoResponse {
    data: Avaliacao[];
    stats: AvaliacaoStats;
}
