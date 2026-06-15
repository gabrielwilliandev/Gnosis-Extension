importScripts('../config.js', 'notificacoes.js');

const ALARM_NAME = 'checkGnosisTasks';
const ALARM_PERIOD_MINUTES = 30;

async function iniciarMonitoramento() {
    const { userId, token, refreshToken } = await getSessao();
    if (!userId || (!token && !refreshToken)) return;

    chrome.alarms.create(ALARM_NAME, { periodInMinutes: ALARM_PERIOD_MINUTES });
    checarTarefasPendentes();
}

chrome.runtime.onInstalled.addListener(() => {
    console.log('[Gnosis Oracle] Service Worker instalado e pronto.');
    iniciarMonitoramento();
});

chrome.runtime.onStartup.addListener(() => {
    iniciarMonitoramento();
});

chrome.runtime.onMessage.addListener((mensagem, sender, sendResponse) => {
    if (mensagem.acao === 'INICIAR_MONITORAMENTO') {
        chrome.alarms.create(ALARM_NAME, { periodInMinutes: ALARM_PERIOD_MINUTES });
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
