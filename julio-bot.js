const fs = require('fs');
const path = require('path');
const http = require('http');
const { execSync } = require('child_process');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const qrcodePkg = require('qrcode');
const QR_PORT = process.env.PORT || 3000;
let ultimoQR = null;
http.createServer((req, res) => {
    if (ultimoQR) {
        qrcodePkg.toBuffer(ultimoQR, { scale: 10 }, (err, buf) => {
            if (err) { res.writeHead(500); res.end('erro'); return; }
            res.writeHead(200, { 'Content-Type': 'image/png' });
            res.end(buf);
        });
    } else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<h2>Aguardando QR...</h2><meta http-equiv="refresh" content="3">');
    }
}).listen(QR_PORT, () => console.log(`🌐 QR disponível em http://localhost:${QR_PORT}`));
function detectChromium() {
    if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
    const candidates = ['chromium', 'chromium-browser', 'google-chrome', 'google-chrome-stable'];
    for (const bin of candidates) {
        try { return execSync(`which ${bin}`).toString().trim(); } catch (e) {}
    }
    return '/usr/bin/chromium';
}
const CHROMIUM_PATH = detectChromium();
console.log(`🌐 Chromium: ${CHROMIUM_PATH}`);
const TARGET_GROUP_NAMES = [
    'Puxadinho da Tia Patida'
];
const TARGET_GROUP_IDS = new Set();
const ASIAN_COUNTRY_CODES = [
    '86',
    '62',
    '60',
    '66',
    '84',
    '81',
    '82',
    '91',
    '92',
    '63',
    '65',
    '880',
    '94',
    '95',
    '977',
    '855',
    '856'
];
const PALAVROES = [
    'puta', 'puto', 'merda', 'caralho', 'porra', 'foda', 'foder', 'fodase',
    'fdp', 'viado', 'buceta', 'cu ', ' cu,', 'arrombado', 'babaca',
    'idiota', 'imbecil', 'otario', 'cuzao', 'vsf', 'vtnc', 'tnc', 'kct',
    'corno', 'prostituta', 'vagabundo', 'vagabunda', 'lazaro'
];
const ALERTA_CBL = `⚠️ ALERTA sobre o CBL-514
Qualquer produto vendido hoje como CBL-514 no mercado paralelo (especialmente como pó liofilizado comum) pode ser considerado falsificação. Embora os compostos principais sejam conhecidos, é impossível replicar a fórmula original hoje.
A fórmula exata desconhecida: A patente da Caliway (US10226503B2) protege proporções que vão desde 1:30 até 9:1. Existe um exemplo de 1:19 no documento, mas não há confirmação de que essa seja a proporção real usada na Fase 3.
O método de solubilização desconhecido: Resveratrol e curcumina não dissolvem em água. A patente aponta o uso de surfactantes específicos (~20% de Kolliphor/Cremophor ELP) em solução salina, mas o método exato de produção e solubilização não foi divulgado.`;
const PASTA_PROTOCOLOS = fs.existsSync(path.join(__dirname, 'protocolos'))
    ? path.join(__dirname, 'protocolos')
    : path.join(__dirname, 'protocolo');
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        executablePath: CHROMIUM_PATH,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            '--disable-extensions'
        ]
    }
});
function buscarProtocolo(nomeSolicitado) {
    try {
        if (!fs.existsSync(PASTA_PROTOCOLOS)) {
            console.error(`⚠️ Pasta de protocolos não encontrada em: ${PASTA_PROTOCOLOS}`);
            return null;
        }
        const chaveBusca = nomeSolicitado
            .normalize('NFD')
            .replace(/[̀-ͯ]/g, '')
            .replace(/[^a-zA-Z0-9]/g, '')
            .toLowerCase();
        if (!chaveBusca) return null;
        const arquivos = fs.readdirSync(PASTA_PROTOCOLOS);
        const arquivoEncontrado = arquivos.find(arq => {
            if (!arq.toLowerCase().endsWith('.txt')) return false;
            const nomeBase = path.basename(arq, path.extname(arq))
                .normalize('NFD')
                .replace(/[̀-ͯ]/g, '')
                .replace(/[^a-zA-Z0-9]/g, '')
                .toLowerCase();
            return nomeBase === chaveBusca;
        });
        if (arquivoEncontrado) {
            return fs.readFileSync(path.join(PASTA_PROTOCOLOS, arquivoEncontrado), 'utf8').trim();
        }
    } catch (err) {
        console.error('Erro ao ler pasta de protocolos:', err.message);
    }
    return null;
}
function normalizarNome(str) {
    return (str || '')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[–—]/g, '-')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
}
const NOMES_ALVO_NORMALIZADOS = TARGET_GROUP_NAMES.map(normalizarNome);
function isAsianNumber(authorId) {
    if (!authorId) return false;
    const num = authorId.replace(/@.*$/, '');
    if (num.startsWith('55')) return false;
    return ASIAN_COUNTRY_CODES.some(code => num.startsWith(code));
}
function temLink(texto) {
    return /https?:\/\/\S+|www\.\S+/i.test(texto);
}
function temSeringaCaraComLink(texto) {
    if (!/\bsering[ao]s?\b/i.test(texto)) return false;
    if (!temLink(texto)) return false;
    const valores = [...texto.matchAll(/R\$\s*(\d{1,4}(?:[.,]\d{2})?)/g)]
        .map(m => parseFloat(m[1].replace(',', '.')));
    return valores.some(v => v > 110);
}
function normalizarTexto(str) {
    return (str || '')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase();
}
function temPalavrão(texto) {
    const normalizado = normalizarTexto(texto);
    return PALAVROES.some(p => normalizado.includes(normalizarTexto(p)));
}
async function apagarMensagemParaTodos(message) {
    try {
        await message.delete(true);
    } catch (e) {
        console.error('Aviso no message.delete(true):', e.message);
    }
    try {
        await client.pupPage.evaluate(async (msgId) => {
            const msg = window.Store.Msg.get(msgId) || (await window.Store.Msg.getMessagesById([msgId]))?.messages?.[0];
            if (!msg) return;
            const chat = window.Store.Chat.get(msg.id.remote) || await window.Store.Chat.find(msg.id.remote);
            if (!chat) return;
            if (window.Store.Cmd && window.Store.Cmd.sendRevokeMsgs) {
                await window.Store.Cmd.sendRevokeMsgs(chat, { list: [msg], type: 'message' }, { clearMedia: true });
            } else if (window.Store.SendRevokeMsgs && window.Store.SendRevokeMsgs.sendRevokeMsgs) {
                await window.Store.SendRevokeMsgs.sendRevokeMsgs(chat, [msg], { clearMedia: true, type: 'Admin' });
            }
        }, message.id._serialized);
    } catch (err) {
        console.error('Erro no fallback de exclusão:', err.message);
    }
}
client.on('qr', qr => {
    ultimoQR = qr;
    qrcode.generate(qr, { small: true });
    console.log(`📷 Novo QR gerado — abra a URL do serviço no browser para escanear`);
});
client.on('ready', async () => {
    console.log('Julio bot pronto! Buscando grupos alvo...');
    console.log(`📂 Pasta de protocolos: ${PASTA_PROTOCOLOS}`);
    try {
        const chats = await client.getChats();
        const grupos = chats.filter(c =>
            c.isGroup && NOMES_ALVO_NORMALIZADOS.includes(normalizarNome(c.name))
        );
        for (const grupo of grupos) {
            TARGET_GROUP_IDS.add(grupo.id._serialized);
            console.log(`✅ Monitorando: "${grupo.name}" | ID: ${grupo.id._serialized}`);
        }
        if (grupos.length === 0) {
            console.log('⚠️ Nenhum grupo encontrado. Verifique TARGET_GROUP_NAMES no código.');
        }
    } catch (err) {
        console.error('Erro ao buscar grupos:', err.message);
    }
});
client.on('message_create', async message => {
    try {
        if (!message || !message.id || !message.id._serialized || message.fromMe) return;
        const chatId = message.from.endsWith('@g.us')
            ? message.from
            : (message.to && message.to.endsWith('@g.us') ? message.to : null);
        if (!chatId) return;
        if (!TARGET_GROUP_IDS.has(chatId)) {
            const chat = await client.getChatById(chatId);
            if (chat && NOMES_ALVO_NORMALIZADOS.includes(normalizarNome(chat.name))) {
                TARGET_GROUP_IDS.add(chatId);
                console.log(`✅ Novo grupo detectado em tempo real: "${chat.name}" | ID: ${chatId}`);
            } else {
                return;
            }
        }
        const texto = message.body || '';
        const rawData = message._data || {};
        const autorId = message.author || message.from || '';
        const isForwardedChannel = Boolean(
            rawData.forwardedNewsletterMessageInfo ||
            rawData.newsletterAdminInviteInfo ||
            (rawData.parentMsgKey && String(rawData.parentMsgKey).includes('@newsletter')) ||
            /whatsapp\.com\/channel\//i.test(texto)
        );
        if (isForwardedChannel) {
            await new Promise(r => setTimeout(r, 300));
            await apagarMensagemParaTodos(message);
            await client.sendMessage(chatId, '🚫 Link de canal removido.');
            console.log(`🚫 [${chatId}] Canal removido.`);
            return;
        }
        const groupLinksMatch = texto.match(/chat\.whatsapp\.com(?:\/invite)?\/([a-zA-Z0-9_-]+)/gi) || [];
        const hasGroupLink =
            groupLinksMatch.length > 0 ||
            /chat\.whatsapp\.com/i.test(texto) ||
            message.type === 'groups_v4_invite' ||
            rawData.type === 'groups_v4_invite';
        if (hasGroupLink) {
            await new Promise(r => setTimeout(r, 300));
            await apagarMensagemParaTodos(message);
            await client.sendMessage(chatId, '🚫 Link de grupo removido.');
            console.log(`🚫 [${chatId}] Link de grupo removido.`);
            return;
        }
        if (isAsianNumber(autorId) && temLink(texto)) {
            await new Promise(r => setTimeout(r, 300));
            await apagarMensagemParaTodos(message);
            await client.sendMessage(chatId, '🚫 Link de número estrangeiro suspeito removido.');
            console.log(`🚫 [${chatId}] Link de número asiático removido (${autorId}).`);
            return;
        }
        if (temSeringaCaraComLink(texto)) {
            await new Promise(r => setTimeout(r, 300));
            await apagarMensagemParaTodos(message);
            await client.sendMessage(chatId, '🚫 Link removido: seringa acima de R$110,00 não permitida aqui.');
            console.log(`🚫 [${chatId}] Link de seringa cara removido.`);
            return;
        }
        if (temPalavrão(texto)) {
            await new Promise(r => setTimeout(r, 300));
            await apagarMensagemParaTodos(message);
            await client.sendMessage(chatId, '🚫 Mensagem com linguagem inadequada removida. Mantenha o respeito! 🙏');
            console.log(`🚫 [${chatId}] Palavrão detectado e removido.`);
            return;
        }
        const matchProtocolo = texto.trim().match(/^!protocolo\s+(.+)$/i);
        if (matchProtocolo) {
            const nomePeptideo = matchProtocolo[1].trim();
            const conteudo = buscarProtocolo(nomePeptideo);
            if (conteudo) {
                await client.sendMessage(chatId, conteudo);
                console.log(`📄 [${chatId}] Protocolo "${nomePeptideo}" enviado.`);
            } else {
                await client.sendMessage(chatId, `Protocolo para "${nomePeptideo}" não encontrado.`);
            }
            return;
        }
        if (/\bcbl(?:-?514)?\b/i.test(texto)) {
            await client.sendMessage(chatId, ALERTA_CBL);
            console.log(`ℹ️ [${chatId}] Alerta CBL enviado.`);
        }
        if (/\bjulio\b/i.test(texto)) {
            await client.sendMessage(chatId, 'Oi! 👋 Sou o Julio, bot deste grupo. Estou aqui pra manter tudo organizado!');
            console.log(`✅ [${chatId}] Julio mencionado, respondido.`);
        }
    } catch (error) {
        console.error('Erro ao processar mensagem:', error.message);
    }
});
client.initialize();
const encerrarBot = async () => {
    console.log('\nEncerrando Julio bot...');
    try { await client.destroy(); } catch (e) {}
    process.exit(0);
};
process.on('SIGINT', encerrarBot);
process.on('SIGTERM', encerrarBot);