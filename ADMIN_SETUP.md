# Configuração do Administrador

## Credenciais do Administrador

O sistema está configurado para aceitar apenas um usuário administrador específico:

- **Email:** dir.adm@uenp.edu.br
- **Senha:** admin

## Como Criar o Usuário Administrador

1. Acesse a página de login: `/auth/login`
2. Clique em "Criar conta" (se disponível) ou use a página de cadastro
3. Cadastre-se com as credenciais acima:
   - Email: dir.adm@uenp.edu.br
   - Senha: admin
4. Confirme o email (se necessário, verifique o email de confirmação do Supabase)
5. Faça login com as credenciais

## Segurança

⚠️ **IMPORTANTE:** Após o primeiro acesso, é altamente recomendado:

1. Alterar a senha padrão "admin" para uma senha forte
2. Configurar autenticação de dois fatores (se disponível)
3. Nunca compartilhar as credenciais de administrador

## Políticas de Segurança

O sistema implementa as seguintes políticas de segurança:

- **RLS (Row Level Security):** Apenas o email dir.adm@uenp.edu.br pode criar, editar ou excluir dados
- **Middleware:** Apenas usuários autenticados com o email específico podem acessar rotas `/admin/*`
- **Acesso Público:** Qualquer pessoa pode consultar contratos através da interface pública `/consulta`

## Troubleshooting

Se você não conseguir fazer login:

1. Verifique se o email está correto (dir.adm@uenp.edu.br)
2. Verifique se confirmou o email no Supabase
3. Tente redefinir a senha através da página de login
4. Verifique os logs do Supabase para erros de autenticação
