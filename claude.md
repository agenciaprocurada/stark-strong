## Ambiente local

- Dev: `npm run dev` → http://localhost:4321

## Revisão obrigatória ao finalizar

- Sempre que finalizar uma tarefa, revisar a ação acessando http://localhost:4321 na página que foi mexida e confirmar que tudo está funcionando.
- Se não estiver funcionando, ajustar e revisar de novo, repetindo até funcionar corretamente.

## Dados Supabase

As credenciais ficam no arquivo `.env` (fora do git). Variáveis disponíveis:

- `SUPABASE_URL` — URL do projeto
- `SUPABASE_DB_PASSWORD` — senha do banco
- `PUBLIC_SUPABASE_ANON_KEY` — chave pública (pode ir ao cliente)
- `SUPABASE_SERVICE_ROLE_KEY` — chave de acesso total, **só server-side, nunca no cliente**

## Assets (_uploads e _design-claude)

- Tudo que estiver em `_uploads/` deve ser COPIADO para dentro da estrutura do projeto (ex.: `public/`) antes de ser usado.
- JAMAIS referenciar no código um caminho que aponte para `_uploads/` ou `_design-claude/`. Essas pastas são temporárias e serão apagadas — qualquer link para elas vai quebrar.
- Fluxo correto: copiar o arquivo de `_uploads/` para `public/...` e referenciar a cópia que está dentro de `public/`.

