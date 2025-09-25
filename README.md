# FINANSYS - Sistema de Gestão Financeira

Um sistema completo de gestão financeira desenvolvido em React com integração ao Supabase para autenticação e armazenamento de dados.

## 🚀 Funcionalidades

### Funcionalidades Principais
- **Dashboard**: Visão geral das finanças com gráficos e resumos
- **Entradas e Saídas**: Gestão completa de transações financeiras
- **Notas Fiscais Eletrônicas (NFe)**: Emissão e controle de notas fiscais
- **Lançamentos**: Sistema de lançamentos contábeis detalhados

### Características Técnicas
- ✅ Interface responsiva para desktop e mobile
- ✅ Autenticação segura com Supabase
- ✅ Políticas de segurança RLS (Row Level Security)
- ✅ CRUD completo para todas as entidades
- ✅ Gráficos interativos com Recharts
- ✅ Design moderno com Tailwind CSS e Shadcn/UI

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 18+ com Vite
- **Styling**: Tailwind CSS
- **Componentes**: Shadcn/UI
- **Roteamento**: React Router
- **Gráficos**: Recharts
- **Backend**: Supabase (PostgreSQL)
- **Autenticação**: Supabase Auth
- **Ícones**: Lucide React

## 📋 Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Conta no Supabase

## ⚙️ Configuração do Ambiente

### 1. Clone o repositório
```bash
git clone <url-do-repositorio>
cd finansys-prototype
```

### 2. Instale as dependências
```bash
npm install --legacy-peer-deps
```

### 3. Configure o Supabase

#### 3.1 Crie um projeto no Supabase
1. Acesse [supabase.com](https://supabase.com)
2. Crie uma nova conta ou faça login
3. Crie um novo projeto
4. Anote a URL e a chave anônima do projeto

#### 3.2 Configure as variáveis de ambiente
Crie um arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

#### 3.3 Execute o script SQL no Supabase
Execute o script `supabase_schema.sql` no SQL Editor do Supabase para criar as tabelas e políticas de segurança.

### 4. Inicie o servidor de desenvolvimento
```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais

#### usuarios
- `id_usuario` (UUID, PK)
- `nome` (VARCHAR)
- `email` (VARCHAR, UNIQUE)
- `senha_hash` (VARCHAR)
- `tipo_usuario` (ENUM: admin, analista)
- `data_criacao` (TIMESTAMP)

#### lancamentos
- `id_lancamento` (SERIAL, PK)
- `data` (DATE)
- `valor` (DECIMAL)
- `tipo` (ENUM: entrada, saida)
- `categoria` (VARCHAR)
- `descricao` (TEXT)
- `conta` (VARCHAR)
- `observacoes` (TEXT)
- `id_usuario` (UUID, FK)

#### nfe
- `id_nfe` (SERIAL, PK)
- `numero` (VARCHAR)
- `serie` (VARCHAR)
- `data_emissao` (DATE)
- `valor` (DECIMAL)
- `xml` (TEXT)
- `status` (ENUM: emitida, cancelada, pendente)
- `cliente` (VARCHAR)
- `cnpj` (VARCHAR)
- `id_lancamento` (INTEGER, FK)
- `id_usuario` (UUID, FK)

### Políticas de Segurança (RLS)
Todas as tabelas possuem políticas RLS que garantem que usuários só acessem seus próprios dados.

## 👥 Usuários de Teste

Para testar a aplicação, você pode criar usuários através do painel de autenticação do Supabase ou implementar um sistema de registro.

### Usuários Sugeridos:
- **Admin**: admin@finansys.com
- **Analista**: analista@finansys.com

## 🚀 Deploy

### Build da Aplicação
```bash
npm run build
```

### Deploy no Vercel/Netlify
1. Faça o build da aplicação
2. Configure as variáveis de ambiente na plataforma escolhida
3. Faça o deploy da pasta `dist`

### Deploy Manual
1. Execute `npm run build`
2. Sirva os arquivos da pasta `dist` em um servidor web

## 📱 Uso da Aplicação

### 1. Login
- Acesse a aplicação
- Faça login com suas credenciais
- Será redirecionado para o dashboard

### 2. Dashboard
- Visualize resumos financeiros
- Analise gráficos de receitas vs despesas
- Veja transações recentes

### 3. Entradas e Saídas
- Adicione novas transações
- Edite transações existentes
- Filtre por tipo e categoria
- Visualize resumos por período

### 4. Notas Fiscais (NFe)
- Emita novas notas fiscais
- Adicione produtos/serviços
- Controle status das notas
- Cancele notas quando necessário

### 5. Lançamentos
- Registre lançamentos contábeis
- Visualize débitos e créditos
- Mantenha controle do balanceamento

## 🔧 Desenvolvimento

### Estrutura de Pastas
```
src/
├── components/          # Componentes reutilizáveis
│   ├── ui/             # Componentes base do Shadcn/UI
│   ├── Layout.jsx      # Layout principal
│   └── ProtectedRoute.jsx
├── contexts/           # Contextos React
│   └── AuthContext.jsx # Contexto de autenticação
├── lib/               # Utilitários
│   └── supabase.js    # Configuração do Supabase
├── pages/             # Páginas da aplicação
│   ├── Dashboard.jsx
│   ├── EntradasSaidas.jsx
│   ├── NFe.jsx
│   ├── Lancamentos.jsx
│   └── Login.jsx
└── main.jsx           # Ponto de entrada
```

### Scripts Disponíveis
- `npm run dev` - Inicia servidor de desenvolvimento
- `npm run build` - Gera build de produção
- `npm run preview` - Visualiza build de produção
- `npm run lint` - Executa linting do código

## 🐛 Solução de Problemas

### Erro de Dependências
Se encontrar erros de dependências, use:
```bash
npm install --legacy-peer-deps
```

### Erro de Autenticação
1. Verifique se as variáveis de ambiente estão corretas
2. Confirme se o usuário existe no Supabase Auth
3. Verifique se as políticas RLS estão configuradas

### Erro de CORS
Certifique-se de que o domínio está configurado nas configurações do Supabase.

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📞 Suporte

Para suporte, entre em contato através do email: suporte@finansys.com

---

**FINANSYS** - Sistema de Gestão Financeira © 2024

