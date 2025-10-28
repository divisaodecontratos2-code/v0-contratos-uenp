# Instruções para Configurar o Login do Administrador

## Passo 1: Desabilitar Confirmação de Email no Supabase (Recomendado para Desenvolvimento)

Para facilitar o acesso inicial ao sistema, você pode desabilitar a confirmação de email:

1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **Authentication** → **Providers** → **Email**
4. Desmarque a opção **"Confirm email"**
5. Clique em **Save**

## Passo 2: Criar a Conta do Administrador

1. Acesse a página de cadastro: `/auth/signup`
2. Preencha os dados:
   - **Email**: `dir.adm@uenp.edu.br`
   - **Senha**: `admin` (ou outra senha de sua preferência)
   - **Confirmar Senha**: mesma senha
3. Clique em **Criar Conta**

### Se a confirmação de email estiver HABILITADA:
- Você receberá um email de confirmação
- Clique no link do email para confirmar sua conta
- Depois, faça login em `/auth/login`

### Se a confirmação de email estiver DESABILITADA:
- A conta será criada imediatamente
- Você pode fazer login direto em `/auth/login`

## Passo 3: Fazer Login

1. Acesse `/auth/login`
2. Entre com:
   - **Email**: `dir.adm@uenp.edu.br`
   - **Senha**: a senha que você definiu
3. Você será redirecionado para o painel administrativo

## Solução de Problemas

### "Email ou senha incorretos"
- Verifique se você digitou o email e senha corretamente
- Certifique-se de que a conta foi criada com sucesso

### "Por favor, confirme seu email antes de fazer login"
- Verifique sua caixa de entrada (e spam) para o email de confirmação
- OU desabilite a confirmação de email no Supabase (ver Passo 1)

### "Acesso não autorizado" após login
- Apenas o email `dir.adm@uenp.edu.br` tem acesso ao painel administrativo
- Verifique se você está usando exatamente este email

## Segurança em Produção

⚠️ **IMPORTANTE**: Antes de colocar o sistema em produção:

1. **Mude a senha padrão** para uma senha forte
2. **Habilite a confirmação de email** no Supabase
3. **Configure autenticação de dois fatores** se disponível
4. **Revise as políticas de segurança** do Supabase
</parameter>
