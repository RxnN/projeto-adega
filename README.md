# Adegas — Gestão de Estoque e Vendas (Protótipo)

Protótipo funcional de um sistema **SaaS multi-tenant** para gestão de estoque e vendas de
adegas (lojas de vinhos e destilados). Cada adega possui seus próprios usuários, produtos e
movimentações, totalmente isolados dos dados de outras adegas.

## Stack técnica

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** para estilização
- **Camada de dados**: modelo documentado em `prisma/schema.prisma` (Prisma + SQLite), mas
  implementado em runtime com o módulo nativo **`node:sqlite`** do Node.js — veja a seção
  "Nota técnica" abaixo para o motivo dessa decisão.
- **Autenticação**: sessão via cookie assinado e criptografado (`iron-session`), com senhas
  com hash `bcryptjs`. Sem NextAuth, implementação enxuta e própria.
- **QR Code**: geração com o pacote `qrcode` (cada produto tem um QR Code único que codifica
  seu ID) e leitura via câmera com `html5-qrcode` na tela de Movimentação (saída).

### Nota técnica: por que `node:sqlite` em vez do Prisma Client em runtime?

O modelo de dados foi desenhado e está **100% documentado em `prisma/schema.prisma`**,
seguindo exatamente a estrutura pedida (Adega, User, Product, Movement, enums, relações,
índices). Em um ambiente com acesso normal à internet, esse schema funciona diretamente com
`npx prisma migrate dev` e `@prisma/client`.

Porém, o ambiente sandbox usado para construir este protótipo bloqueia por política de rede o
host `binaries.prisma.sh`, de onde o Prisma **precisa baixar seu engine nativo** — isso afeta
até o comando `prisma generate`, não apenas `migrate`. Como não há alternativa (não existem
binários pré-compilados publicados no npm, e a compilação nativa de alternativas como
`better-sqlite3` também depende de downloads bloqueados), a camada de acesso a dados
(`lib/db.ts` e `lib/repo.ts`) foi implementada com o módulo **nativo e embutido no Node.js
22.5+** `node:sqlite` (`DatabaseSync`), que não exige nenhum download nem compilação nativa.

As tabelas criadas por `lib/db.ts` espelham **exatamente** o schema do Prisma. Se você rodar
este projeto em um ambiente sem essa restrição de rede, pode voltar a usar
`npx prisma migrate dev` e `@prisma/client` normalmente — o schema já está pronto para isso.

## Instalação e execução

Pré-requisito: **Node.js 22.5 ou superior** (necessário para o módulo `node:sqlite`).

```bash
npm install
npm run db:seed     # cria o banco SQLite e popula com dados de demonstração
npm run dev          # inicia o servidor de desenvolvimento em http://localhost:3000
```

Para build de produção:

```bash
npm run build
npm start
```

O banco de dados é um arquivo local em `prisma/dev.db` (criado automaticamente na primeira
execução ou pelo script de seed). Para recomeçar do zero, rode `npm run db:seed` novamente —
ele apaga e recria todos os dados.

## Credenciais de demonstração

Todos os usuários abaixo pertencem à adega **"Adega do Renan"** e usam a senha `senha123`.

| E-mail                  | Papel        | O que enxerga |
|--------------------------|--------------|---------------|
| `dono@adega.com`         | Dono (OWNER) | Acesso total: movimentação, produtos (CRUD completo) e todos os relatórios (todos os períodos, sugestão de compra, ranking de recorrência). |
| `gerente@adega.com`      | Gerente (MANAGER) | Movimentação de estoque e relatório **limitado**: apenas estoque atual e faturamento/saídas do mês corrente. Produtos em modo somente leitura. |
| `funcionario@adega.com`  | Funcionário (EMPLOYEE) | Apenas a tela de Movimentação de Estoque (entradas e saídas) e listagem de produtos somente leitura, para apoiar o registro de movimentações. Sem acesso a relatórios ou cadastro de produtos. |

## Telas e funcionalidades

1. **Login** (`/`) — e-mail e senha; redireciona conforme o papel do usuário após autenticar.
2. **Movimentação de Estoque** (`/movimentacao`) — disponível para todos os papéis. Permite
   registrar entradas (compras/reposição) e saídas (vendas), com quantidade e valor unitário
   (pré-preenchido com custo/venda do produto, editável). Para saídas, há um botão
   **"Escanear QR Code"** que abre a câmera (via `html5-qrcode`) para identificar o produto
   automaticamente; a seleção manual em um `<select>` continua disponível como alternativa
   sempre visível. O sistema avisa quando uma saída deixaria o estoque negativo e pede
   confirmação explícita antes de permitir (não bloqueia — é um protótipo realista).
3. **Produtos** (`/produtos`) — listagem para todos os papéis (somente leitura para
   Gerente/Funcionário). Dono pode criar, editar e excluir produtos. Cada produto tem uma
   página de detalhe (`/produtos/[id]`) que gera e exibe seu **QR Code** (codificando o ID do
   produto), com botão para baixar/imprimir a imagem.
4. **Relatórios** (`/relatorios`) — acesso apenas para Dono e Gerente (bloqueado
   server-side para Funcionário, não apenas escondido na navegação):
   - **Estoque atual**: quantidade e valor (a custo) de cada produto.
   - **Faturamento e volume vendido**: filtráveis por dia, semana, mês ou período
     customizado (seletor de datas) — filtros completos apenas para o Dono; Gerente vê
     fixo o mês corrente.
   - **Sugestão de compra** (somente Dono): consumo médio diário calculado sobre as saídas
     dos últimos 30 dias, comparado ao estoque atual, estimando dias de estoque restante e
     sugerindo quantidade de reposição para cobrir os próximos 30 dias de demanda média.
   - **Produtos com maior recorrência de saída** (somente Dono): ranking por número de
     movimentações de saída no período (frequência de venda), não apenas por volume.

## Controle de acesso por papel (RBAC)

O controle de acesso é aplicado **tanto na navegação (UI) quanto no backend** (páginas
Server Component e rotas de API), nunca apenas escondendo botões:

- `lib/auth.ts` expõe `requireUser()` e `requireRole()`, usados em toda página que precisa de
  autenticação/permissão — redirecionam para `/` (não logado) ou `/acesso-negado` (sem
  permissão).
- Todas as rotas de API (`/api/produtos`, `/api/produtos/[id]`, `/api/movimentos`, etc.)
  verificam a sessão e o papel do usuário antes de executar qualquer operação, e todas as
  consultas ao banco são filtradas por `adegaId` do usuário logado — garantindo isolamento
  entre adegas (multi-tenant) mesmo que alguém tente manipular um ID de produto de outra
  adega diretamente pela API.

## Limitações conhecidas

- **Leitura de QR Code por câmera** depende de permissão do navegador e de contexto seguro
  (HTTPS ou `localhost`). Em ambientes sandbox/containers sem câmera real ou sem permissão de
  mídia, a inicialização da câmera falha graciosamente com uma mensagem explicativa — a
  seleção manual do produto no formulário **sempre** funciona como alternativa.
- O cliente Prisma não é utilizado em tempo de execução neste protótipo (ver nota técnica
  acima); a camada de dados usa `node:sqlite` seguindo fielmente o mesmo schema.
- Gestão de usuários (criar gerentes/funcionários pela UI) não foi implementada nesta versão
  — é um "nice-to-have" citado no escopo original e pode ser adicionada futuramente
  (o modelo de dados já suporta múltiplos usuários por adega).
- Sem paginação nas listagens (adequado ao volume de dados de um protótipo/demo).
- `node:sqlite` é uma API ainda experimental no Node.js (emite um aviso no console); estável o
  suficiente para este protótipo, mas vale acompanhar a evolução da API em produção.
