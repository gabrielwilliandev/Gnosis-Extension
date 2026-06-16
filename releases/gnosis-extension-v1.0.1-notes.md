# Gnosis Extension v1.0.1

## Destaques

- Corrige duplicidade no disparo de notificacoes.
- Reforca o monitoramento da extensao com reativacao do service worker.
- Mantem o alarme de verificacao rodando a cada 1 minuto.
- Remove o backend de notificacoes que nao era utilizado pelo fluxo real da extensao.

## Arquivo da extensao

Anexe o arquivo abaixo na release do GitHub:

```text
releases/gnosis-extension-v1.0.1.zip
```

O ZIP contem o `manifest.json` na raiz, pronto para upload como pacote de extensao.

## Instalacao manual

1. Baixe e extraia `gnosis-extension-v1.0.1.zip`.
2. Acesse `chrome://extensions`.
3. Ative o modo de desenvolvedor.
4. Clique em "Carregar sem compactacao".
5. Selecione a pasta extraida.

## Observacoes

- Recarregue a extensao apos atualizar o pacote.
- As notificacoes dependem das permissoes do navegador e do sistema operacional.
- Em Manifest V3, o service worker acorda por eventos e alarmes; ele nao permanece em execucao continua.
