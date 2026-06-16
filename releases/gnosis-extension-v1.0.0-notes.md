# Gnosis Extension v1.0.0

## Destaques

- Extensao Manifest V3 para Chrome/Edge.
- Login integrado com a API do Gnosis.
- Listagem de tarefas autenticadas.
- Filtros de tarefas por status, periodo e materias.
- Notificacoes de tarefas pendentes com gatilhos de 1h, 12h, 24h, 3 dias e 1 semana.
- Monitoramento por service worker com alarme periodico.

## Arquivo da extensao

Anexe o arquivo abaixo na release do GitHub:

```text
releases/gnosis-extension-v1.0.0.zip
```

O ZIP ja contem o `manifest.json` na raiz, pronto para upload como pacote de extensao.

## Instalacao manual

1. Baixe e extraia `gnosis-extension-v1.0.0.zip`.
2. Acesse `chrome://extensions`.
3. Ative o modo de desenvolvedor.
4. Clique em "Carregar sem compactacao".
5. Selecione a pasta extraida.

## Observacoes

- A extensao esta configurada para usar a API publicada no Azure.
- As notificacoes dependem das permissoes de notificacao do navegador e do sistema operacional.
- Em Manifest V3, o service worker acorda por eventos e alarmes; ele nao permanece em execucao continua.
