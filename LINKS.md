# Links do Gnosis

## Local

- Backend: http://localhost:3000
- API local: http://localhost:3000/api
- Health check: http://localhost:3000/api/health
- Login web local: http://localhost:3000/
- Home web local: http://localhost:3000/home
- Extensao Chrome: chrome://extensions
- Pasta para carregar a extensao descompactada: `gnosis-extension`

Para rodar local:

```bash
npm run dev
```

No backend, a porta e o Supabase saem do `.env`:

```env
PORT=3000
SUPABASE_URL=...
SUPABASE_KEY=...
```

Na extensao, a troca entre local e Azure fica em `gnosis-extension/js/config.js`.

## Azure

- Backend/API Azure: https://gnosis-api.whitesmoke-57ad5be1.eastus.azurecontainerapps.io
- API Azure: https://gnosis-api.whitesmoke-57ad5be1.eastus.azurecontainerapps.io/api
- Health check Azure: https://gnosis-api.whitesmoke-57ad5be1.eastus.azurecontainerapps.io/api/health
- Login web Azure: https://gnosis-api.whitesmoke-57ad5be1.eastus.azurecontainerapps.io/
- Home web Azure: https://gnosis-api.whitesmoke-57ad5be1.eastus.azurecontainerapps.io/home

## Endpoints uteis

- Login: `POST /api/login`
- Refresh token: `POST /api/refresh`
- Tarefas do usuario: `GET /api/tarefas/usuario/:user_id/TODOS`
- Tarefas pendentes: `GET /api/tarefas/usuario/:user_id/pendentes`
- Atualizar tarefa: `PUT /api/tarefas/activities/:id`
