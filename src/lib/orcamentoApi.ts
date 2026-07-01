/* Stark Strong — envio do orçamento pelo site (público, sem login).
   Usa o cliente anon e chama a função enviar_orcamento no banco (security
   definer): grava o cabeçalho + os itens numa transação só. O anônimo não
   lê nem escreve direto nas tabelas — só dispara essa função. */
import { supabase } from './supabase';

export type ItemEnvio = {
  id: string;
  name: string;
  category?: string;
  img?: string;
  qty: number;
};

export type DadosEnvio = {
  email: string;
  nome?: string;
  academia?: string;
  telefone?: string;
  observacoes?: string;
};

/** Envia o orçamento. Devolve o id gerado. Lança erro com mensagem amigável. */
export async function enviarOrcamento(dados: DadosEnvio, itens: ItemEnvio[]): Promise<number> {
  const { data, error } = await supabase.rpc('enviar_orcamento', {
    p_email: dados.email,
    p_nome: dados.nome ?? null,
    p_academia: dados.academia ?? null,
    p_telefone: dados.telefone ?? null,
    p_observacoes: dados.observacoes ?? null,
    p_itens: itens,
  });
  if (error) throw new Error(traduzEnvioErro(error.message));
  return data as number;
}

function traduzEnvioErro(msg: string): string {
  if (/E-mail é obrigatório/i.test(msg)) return 'Informe um e-mail para receber a proposta.';
  if (/ao menos um item/i.test(msg)) return 'Seu orçamento está vazio.';
  return 'Não foi possível enviar agora. Tente novamente em instantes.';
}
