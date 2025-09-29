import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zaupvohmnaiilistuxtl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InphdXB2b2htbmFpaWxpc3R1eHRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyODY2MTcsImV4cCI6MjA3Mzg2MjYxN30.kQP6BnFj84COj8rrw9iKDLbvHPG-98XcrNXuAmh5dxE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Conversa = {
  id_conversa: string;
  nome_contato: string;
  ultima_mensagem: string | null;
  timestamp: string;
  status: 'ativa' | 'arquivada';
  importante: boolean;
};

export type Mensagem = {
  id: string;
  id_conversa_fk: string;
  remetente: 'contato' | 'operador' | 'sistema';
  conteudo: string;
  timestamp: string;
};


