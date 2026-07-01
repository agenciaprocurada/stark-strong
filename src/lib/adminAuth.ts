/* Stark Strong — autenticação do painel /admin (client-side).
   Roda no browser. Usa o cliente anon (supabase) + Supabase Auth.
   O cadastro fica fechado: só o usuário admin criado no painel Supabase loga. */
import { supabase } from './supabase';
import type { Perfil, PermKey } from './supabase';

const LOGIN_URL = '/admin/login';
const HOME_URL = '/admin';

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

/* ---------- perfil / permissões ---------- */
let _perfil: Perfil | null | undefined;

/** Perfil do usuário logado (cacheado na sessão da página). null = sem perfil/sem acesso. */
export async function getMeuPerfil(force = false): Promise<Perfil | null> {
  if (!force && _perfil !== undefined) return _perfil;
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return (_perfil = null);
  const { data, error } = await supabase.from('perfis').select('*').eq('id', u.user.id).maybeSingle();
  if (error) throw new Error(error.message);
  return (_perfil = (data as Perfil | null) ?? null);
}

export function podeAcessar(perfil: Perfil | null, chave: PermKey): boolean {
  if (!perfil || !perfil.ativo) return false;
  if (perfil.papel === 'admin') return true;
  return (perfil.permissoes || []).includes(chave);
}

/** Topo de página protegida: garante sessão + permissão; senão volta pro /admin. */
export async function guardAccess(chave: PermKey): Promise<Perfil> {
  await requireAuth();
  const perfil = await getMeuPerfil();
  if (!podeAcessar(perfil, chave)) {
    window.location.replace(HOME_URL);
    await new Promise(() => {});
  }
  return perfil!;
}

/** Troca a senha do próprio usuário logado (nativo do Supabase Auth). */
export async function changePassword(novaSenha: string) {
  const { error } = await supabase.auth.updateUser({ password: novaSenha });
  if (error) throw new Error(traduzErro(error.message));
}

function traduzErro(msg: string): string {
  if (/invalid login credentials/i.test(msg)) return 'E-mail ou senha incorretos.';
  if (/email not confirmed/i.test(msg)) return 'E-mail ainda não confirmado.';
  if (/at least.*characters|should be at least|weak password/i.test(msg)) return 'Senha muito curta (mínimo 6 caracteres).';
  if (/same.*password|different from the old/i.test(msg)) return 'A nova senha precisa ser diferente da atual.';
  return msg;
}
