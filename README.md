# Gnosis

Gnosis e uma aplicacao para organizar estudos, materias, tarefas e notificacoes. O projeto combina uma API Node.js com Express, paginas web renderizadas com Mustache e uma extensao de navegador em Manifest V3.

Esta documentacao reflete o estado da branch `develop`.

## Estado atual

- API Express com rotas versionadas em `/api`
- Autenticacao integrada ao Supabase Auth
- Cadastro, login e logout de usuarios no backend
- Sessao via cookie `gnosis_token` e dados de usuario em `gnosis_user`
- Middleware de autenticacao aceitando cookie ou header `Authorization: Bearer <token>`
- CRUD parcial de materias e tarefas
- Integracao com Supabase para persistencia
- Tratamento centralizado de erros
- Views web em `src/views`
- Assets publicos em `public`
- Extensao Chrome/Edge em `gnosis-extension`
- Service worker da extensao com suporte a alarmes, storage, cookies e notificacoes

## Tecnologias

- Node.js
- Express
- Supabase
- Supabase Auth
- JSON Web Token
- JWKS RSA
- Cookie Parser
- CORS
- Dotenv
- Mustache / Mustache Express
- HTML, CSS e JavaScript
- Bootstrap via CDN
- Font Awesome via CDN
- Chrome Extension Manifest V3

## Estrutura do projeto

```text
.
+-- gnosis-extension
|   +-- css
|   +-- icons
|   +-- js
|   |   +-- background
|   |   +-- popup
|   +-- manifest.json
|   +-- popup.html
+-- public
|   +-- css
|   +-- img
|   +-- js
+-- src
|   +-- config
|   +-- controllers
|   +-- entities
|   +-- errors
|   +-- middlewares
|   +-- repositories
|   +-- routes
|   +-- service
|   +-- utils
|   +-- validate
|   +-- views
|   +-- app.js
+-- scripts
+-- package.json
+-- README.md
```

## Configuracao

Crie um arquivo `.env` na raiz do projeto com as credenciais do Supabase:

```env
SUPABASE_URL=sua_url_do_supabase
SUPABASE_KEY=sua_chave_do_supabase
```

## Como executar

Instale as dependencias:

```bash
npm install
```

Inicie o servidor:

```bash
npm run dev
```

Ou diretamente:

```bash
node src/app.js
```

Ambiente publicado:

```text
https://gnosis-api.whitesmoke-57ad5be1.eastus.azurecontainerapps.io/
```

Health check:

```text
https://gnosis-api.whitesmoke-57ad5be1.eastus.azurecontainerapps.io/api/health
```

Para desenvolvimento local, acesse:

```text
http://localhost:3000
```

## Rotas principais

### Usuarios e autenticacao

```text
POST /api/cadastrar
POST /api/login
POST /api/logout
```

Cadastro espera os campos:

```json
{
  "nome": "Nome do usuario",
  "email": "usuario@email.com",
  "cadastrar_senha": "senha",
  "cadastrar_confirmar": "senha"
}
```

Login espera:

```json
{
  "email": "usuario@email.com",
  "senha": "senha"
}
```

Ao fazer login, o backend cria:

- `gnosis_token`: cookie HttpOnly com o token de acesso
- `gnosis_user`: cookie com dados basicos do usuario para uso da interface

### Materias

Rotas protegidas por autenticacao:

```text
POST   /api/materias
GET    /api/materias/usuario/:idUsuario
DELETE /api/materias/:idMateria
```

Cadastro de materia espera:

```json
{
  "nome": "Matematica",
  "idUsuario": "id-do-usuario"
}
```

### Tarefas

Rotas protegidas por autenticacao:

```text
POST   /api/tarefas
GET    /api/tarefas/usuario/:user_id
GET    /api/tarefas/usuario/:user_id/:ano_mes
GET    /api/tarefas/usuario/:user_id/pendentes
GET    /api/tarefas/usuario/tarefaSelecionada/:user_id/:tarefaId
PUT    /api/tarefas/activities/:id
DELETE /api/tarefas/activities/:id
```

Cadastro de tarefa espera, no minimo:

```json
{
  "titulo": "Estudar capitulo 1",
  "descricao": "Resumo e exercicios",
  "data_vencimento": "2026-06-12",
  "hora_vencimento": "18:00",
  "idUsuario": "id-do-usuario",
  "idMaterias": ["id-da-materia"]
}
```

## Autenticacao das rotas protegidas

As rotas protegidas podem receber o token de duas formas:

- Cookie `gnosis_token`, usado pelo web app
- Header `Authorization: Bearer <token>`, usado pela extensao

## Extensao do navegador

A extensao fica em `gnosis-extension` e usa Manifest V3.

Permissoes atuais:

- `notifications`
- `storage`
- `alarms`
- `cookies`

Host autorizado em producao:

```text
https://gnosis-api.whitesmoke-57ad5be1.eastus.azurecontainerapps.io/*
```

Host usado em desenvolvimento local:

```text
http://localhost:3000/*
```

Para carregar durante o desenvolvimento:

1. Acesse `chrome://extensions`
2. Ative o modo de desenvolvedor
3. Use "Carregar sem compactacao"
4. Selecione a pasta `gnosis-extension`

## Observacoes de desenvolvimento

- O backend depende das variaveis `SUPABASE_URL` e `SUPABASE_KEY`.
- O middleware JWT usa o JWKS do projeto Supabase configurado no codigo.
- O script `npm test` ainda nao possui testes automatizados.
- A porta padrao do servidor e `3000`.
- Algumas mensagens e comentarios do codigo ainda precisam de revisao de encoding.

## Proximos passos sugeridos

- Adicionar testes automatizados para autenticacao, materias e tarefas
- Padronizar nomes de arquivos e classes
- Revisar encoding dos arquivos para UTF-8
- Documentar o modelo das tabelas do Supabase
- Adicionar exemplos de respostas da API
- Criar script de build/pacote da extensao

## Equipe

Projeto desenvolvido por:

- Gabriel
- Lavinia
- Bianca
- Lucas
- Marilia
