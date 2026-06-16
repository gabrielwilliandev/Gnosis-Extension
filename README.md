# Gnosis

Gnosis e uma aplicacao para gestao de estudos, disciplinas, tarefas e notificacoes. O projeto combina uma API Node.js com Express, uma interface web renderizada com Mustache e uma extensao de navegador baseada em Chrome Extension Manifest V3.

A plataforma permite cadastrar usuarios, autenticar sessoes, organizar materias, acompanhar tarefas em calendario e receber notificacoes de atividades pendentes.

## Sumario

- [Visao geral](#visao-geral)
- [Arquitetura](#arquitetura)
- [Tecnologias](#tecnologias)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Configuracao](#configuracao)
- [Execucao local](#execucao-local)
- [Autenticacao e seguranca](#autenticacao-e-seguranca)
- [Rotas principais](#rotas-principais)
- [Extensao do navegador](#extensao-do-navegador)
- [Deploy](#deploy)
- [Scripts](#scripts)
- [Observacoes de desenvolvimento](#observacoes-de-desenvolvimento)
- [Proximos passos recomendados](#proximos-passos-recomendados)
- [Equipe](#equipe)

## Visao geral

O Gnosis possui tres superficies principais:

- API backend para autenticacao, materias, tarefas e integracao com Supabase.
- Interface web para login, cadastro e calendario de atividades.
- Extensao Chrome/Edge para acesso rapido, notificacoes e consultas autenticadas.

Funcionalidades implementadas:

- Cadastro, login, refresh de sessao e logout.
- Sessao web via cookies seguros.
- Protecao de rotas da API por JWT.
- Protecao server-side da pagina `/home`.
- Cadastro, listagem e exclusao de materias.
- Cadastro, listagem, atualizacao e exclusao de tarefas.
- Consulta de tarefas pendentes.
- Extensao Manifest V3 com suporte a cookies, alarmes e notificacoes.
- Deploy por GitHub Actions para Azure Container Apps.

## Arquitetura

```text
Usuario
  |
  +-- Web App Express/Mustache
  |     +-- cookies HttpOnly
  |     +-- paginas / e /home
  |
  +-- Extensao Chrome/Edge
        +-- Authorization: Bearer <token>
        +-- cookies do dominio da API

Backend Express
  |
  +-- Controllers
  +-- Services
  +-- Repositories
  +-- Middlewares
  |
Supabase
  +-- Auth
  +-- Persistencia de dados
```

## Tecnologias

- Node.js 22
- Express 5
- Supabase e Supabase Auth
- JSON Web Token
- JWKS RSA
- Cookie Parser
- CORS
- Dotenv
- Mustache e Mustache Express
- HTML, CSS e JavaScript
- Bootstrap via CDN
- Font Awesome via CDN
- Chrome Extension Manifest V3
- Docker
- Azure Container Apps
- GitHub Actions

## Estrutura do projeto

```text
.
|-- .github/workflows
|   `-- deploy-prod.yml
|-- gnosis-extension
|   |-- css
|   |-- icons
|   |-- js
|   |   |-- background
|   |   `-- popup
|   |-- manifest.json
|   `-- popup.html
|-- public
|   |-- css
|   |-- img
|   `-- js
|-- scripts
|-- src
|   |-- config
|   |-- controllers
|   |-- entities
|   |-- errors
|   |-- middlewares
|   |-- repositories
|   |-- routes
|   |-- service
|   |-- utils
|   |-- validate
|   |-- views
|   `-- app.js
|-- docker-compose.yml
|-- Dockerfile
|-- package.json
`-- README.md
```

## Configuracao

Crie um arquivo `.env` na raiz do projeto. Use `.env.example` como referencia:

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=sua-chave-service-role
JWT_SECRET=seu-segredo-jwt
PORT=3000
```

Variaveis usadas pela aplicacao:

- `SUPABASE_URL`: URL do projeto Supabase.
- `SUPABASE_KEY`: chave usada pelo backend para acessar o Supabase.
- `PORT`: porta HTTP do servidor. Padrao: `3000`.
- `JWT_SECRET`: mantida no exemplo de ambiente, embora a validacao atual use JWKS do Supabase.

## Execucao local

Instale as dependencias:

```bash
npm install
```

Inicie a aplicacao:

```bash
npm run dev
```

Acesse:

```text
http://localhost:3000
```

Health check local:

```text
http://localhost:3000/api/health
```

Tambem e possivel executar com Docker:

```bash
docker compose up --build
```

## Autenticacao e seguranca

O backend usa Supabase Auth para autenticar usuarios e valida tokens JWT com JWKS do proprio projeto Supabase.

No login web, o servidor cria:

- `gnosis_token`: cookie HttpOnly com o access token.
- `gnosis_refresh_token`: cookie HttpOnly com o refresh token.
- `gnosis_user`: cookie acessivel ao JavaScript com dados basicos para a interface.

As rotas protegidas aceitam token de duas formas:

- Cookie `gnosis_token`, usado pelo web app.
- Header `Authorization: Bearer <token>`, usado pela extensao.

A pagina `/home` tambem e protegida no servidor. Quando nao ha token valido, a requisicao e redirecionada para `/` antes da renderizacao da tela.

## Rotas principais

### Paginas web

```text
GET /       Login e cadastro
GET /home   Home protegida por autenticacao
```

### Saude e diagnostico

```text
GET /api/health
GET /api/debug/build
```

### Usuarios e sessao

```text
POST /api/cadastrar
POST /api/login
POST /api/refresh
POST /api/logout
```

Exemplo de cadastro:

```json
{
  "nome": "Nome do usuario",
  "email": "usuario@email.com",
  "cadastrar_senha": "senha",
  "cadastrar_confirmar": "senha"
}
```

Exemplo de login:

```json
{
  "email": "usuario@email.com",
  "senha": "senha"
}
```

### Materias

Todas as rotas abaixo exigem autenticacao:

```text
POST   /api/materias
GET    /api/materias/usuario/:idUsuario
DELETE /api/materias/:idMateria
```

Exemplo de criacao:

```json
{
  "nome": "Matematica",
  "idUsuario": "id-do-usuario"
}
```

### Tarefas

Todas as rotas abaixo exigem autenticacao:

```text
POST   /api/tarefas
GET    /api/tarefas/usuario/:user_id
GET    /api/tarefas/usuario/:user_id/:ano_mes
GET    /api/tarefas/usuario/:user_id/pendentes
GET    /api/tarefas/usuario/tarefaSelecionada/:user_id/:tarefaId
PUT    /api/tarefas/activities/:id
DELETE /api/tarefas/activities/:id
```

Exemplo de criacao:

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

Exemplo de atualizacao:

```json
{
  "titulo": "Revisar capitulo 1",
  "descricao": "Resumo, exercicios e revisao",
  "status": "Pendente",
  "data_vencimento": "2026-06-12",
  "hora_vencimento": "19:00",
  "idMaterias": ["id-da-materia"]
}
```

## Extensao do navegador

A extensao fica em `gnosis-extension` e usa Manifest V3.

Permissoes declaradas:

- `notifications`
- `storage`
- `alarms`
- `cookies`

Hosts autorizados:

```text
https://gnosis-api.whitesmoke-57ad5be1.eastus.azurecontainerapps.io/*
http://localhost:3000/*
```

Para carregar durante o desenvolvimento:

1. Acesse `chrome://extensions`.
2. Ative o modo de desenvolvedor.
3. Clique em "Carregar sem compactacao".
4. Selecione a pasta `gnosis-extension`.

A base da API usada pela extensao pode ser ajustada em:

```text
gnosis-extension/js/config.js
```

## Deploy

O deploy de producao usa GitHub Actions, Docker e Azure Container Apps.

Workflow:

```text
.github/workflows/deploy-prod.yml
```

Fluxo do deploy:

1. Checkout do codigo.
2. Login no Azure Container Registry.
3. Build da imagem Docker.
4. Push das tags `github.sha` e `latest`.
5. Login no Azure.
6. Atualizacao do Azure Container App com a imagem gerada.

Secrets esperados no GitHub:

- `ACR_LOGIN_SERVER`
- `ACR_USERNAME`
- `ACR_PASSWORD`
- `AZURE_CREDENTIALS`
- `AZURE_CONTAINER_APP_NAME`
- `AZURE_RESOURCE_GROUP`

Ambiente publicado:

```text
https://gnosis-api.whitesmoke-57ad5be1.eastus.azurecontainerapps.io
```

Health check de producao:

```text
https://gnosis-api.whitesmoke-57ad5be1.eastus.azurecontainerapps.io/api/health
```

## Scripts

```bash
npm run dev
npm run diagnose:materias
npm run test:materias
npm test
```

Notas:

- `npm run dev` inicia o servidor Express.
- `diagnose:materias` executa o script de diagnostico de materias.
- `npm test` ainda nao possui uma suite automatizada configurada.

## Observacoes de desenvolvimento

- A porta padrao da API e `3000`.
- Os arquivos estaticos sao servidos a partir de `public`.
- As views ficam em `src/views`.
- O CSS principal do web app e carregado diretamente no `<head>` das views.
- Algumas mensagens e comentarios ainda precisam de revisao de encoding para UTF-8.
- O projeto ainda nao possui cobertura automatizada de testes.

## Proximos passos recomendados

- Adicionar testes automatizados para autenticacao, materias e tarefas.
- Padronizar encoding dos arquivos para UTF-8.
- Documentar o modelo de dados do Supabase.
- Criar exemplos completos de respostas da API.
- Adicionar pipeline de validacao antes do deploy.
- Criar processo de empacotamento da extensao.

## Equipe

Projeto desenvolvido por:

- Gabriel
- Lavinia
- Bianca
- Lucas
- Marilia
