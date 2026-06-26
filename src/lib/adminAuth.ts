/* Stark Strong — autenticação do painel /admin (client-side).
   Roda no browser. Usa o cliente anon (supabase) + Supabase Auth.
   O cadastro fica fechado: só o usuário admin criado no painel Supabase loga. */
import { supabase } from './supabase';

const LOGIN_URL = '/admin/login';

/** Garante sessão ativa. Sem sessão, redireciona pro login e nunca resolve. */
export async function requireAuth() {
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    window.location.replace(LOGIN_URL);
    // trava o restante do script da página até o redirect acontecer
    await new Promise(() => {});
  }
  return data.session!;
}

export async function signIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(traduzErro(error.message));
}

export async function signOut() {
  await supabase.auth.signOut();
  window.location.replace(LOGIN_URL);
}

export async function getEmail(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  return data.user?.email ?? '';
}

/** Iniciais p/ o avatar (ex.: "ana@x.com" -> "AN"). */
export function iniciais(email: string): string {
  const base = (email.split('@')[0] || 'AD').replace(/[^a-zA-Z]/g, '');
  return (base.slice(0, 2) || 'AD').toUpperCase();
}

function traduzErro(msg: string): string {
  if (/invalid login credentials/i.test(msg)) return 'E-mail ou senha incorretos.';
  if (/email not confirmed/i.test(msg)) return 'E-mail ainda não confirmado.';
  return msg;
}
