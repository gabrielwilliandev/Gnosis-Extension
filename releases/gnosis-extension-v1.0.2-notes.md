# Gnosis Extension v1.0.2

## Destaques

- Corrige duplicidade causada por chaves antigas de notificacao no storage da extensao.
- Mantem compatibilidade com notificacoes salvas nos formatos antigos `id-gatilho` e novo `id`.
- Evita redisparo quando a mesma tarefa ja foi marcada como notificada em versoes anteriores.

## Arquivo da extensao

Anexe o arquivo abaixo na release do GitHub:

```text
releases/gnosis-extension-v1.0.2.zip
```

O ZIP contem o `manifest.json` na raiz, pronto para upload como pacote de extensao.

## Instalacao manual

1. Baixe e extraia `gnosis-extension-v1.0.2.zip`.
2. Acesse `chrome://extensions`.
3. Ative o modo de desenvolvedor.
4. Clique em "Carregar sem compactacao".
5. Selecione a pasta extraida.

## Observacoes

- Recarregue a extensao apos atualizar o pacote.
- Feche notificacoes antigas que ja estavam abertas antes de validar a nova versao.
- As notificacoes dependem das permissoes do navegador e do sistema operacional.
