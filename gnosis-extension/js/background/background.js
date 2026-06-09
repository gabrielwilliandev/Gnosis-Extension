importScripts('notificacoes.js');

const ALARM_NAME = 'checkGnosisTasks';

chrome.runtime.onInstalled.addListener(() => {
    console.log('[Gnosis Oracle] Service Worker instalado e pronto.');
});

chrome.runtime.onMessage.addListener((mensagem, sender, sendResponse) => {
    if (mensagem.acao === 'INICIAR_MONITORAMENTO') {
        chrome.alarms.create(ALARM_NAME, { periodInMinutes: 30 });
        checarTarefasPendentes();
        sendResponse({ status: 'Monitoramento ativado' });
    } else if (mensagem.acao === 'PARAR_MONITORAMENTO') {
        chrome.alarms.clear(ALARM_NAME);
        chrome.storage.local.remove(['tarefas_notificadas']);
        sendResponse({ status: 'Monitoramento parado' });
    }
    return true;
});

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === ALARM_NAME) checarTarefasPendentes();
});