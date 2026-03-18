import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode';

class WppService {
  constructor() {
    this.sessions = new Map(); // Guarda as instâncias por tenantId
    this.io = null;
  }

  initialize(io) {
    this.io = io;
    console.log('🐊 Calango-food: Motor de WhatsApp pronto para conexões sob demanda.');
  }

  // Inicia o WhatsApp apenas para o usuário que solicitar
  async startSession(tenantId) {
    // 1. TRAVA DE SEGURANÇA: Se já existe uma sessão carregando ou conectada, não inicie outra
    if (this.sessions.has(tenantId.toString())) {
      const session = this.sessions.get(tenantId.toString());
      if (session.status === 'connecting' || session.status === 'connected') {
        console.log(`⚠️ Sessão já ativa ou iniciando para: ${tenantId}`);
        return;
      }
    }

    console.log(`🚀 Iniciando WhatsApp para: ${tenantId}`);

    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: `session-${tenantId}`,
        dataPath: './.wwebjs_auth' // Define um caminho fixo para os dados
      }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-extensions',
          '--disable-component-extensions-with-background-pages',
          '--disable-default-apps',
          '--mute-audio',
          '--no-default-browser-check',
          '--autoplay-policy=user-gesture-required',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-notifications',
          '--disable-background-networking',
          '--disable-breakpad',
          '--disable-component-update',
          '--disable-domain-reliability',
          '--disable-sync',
          '--disable-remote-fonts',
          '--blink-settings=imagesEnabled=false',
          '--disable-software-rasterizer',
          '--disable-features=IsolateOrigins,site-per-process'
        ]
      }
    });

    // Marcamos como iniciando
    this.sessions.set(tenantId.toString(), { client, status: 'connecting' });
    this.io.to(tenantId.toString()).emit('whatsapp_status', { status: 'Iniciando...' });

    client.on('qr', async (qr) => {
      const qrBase64 = await qrcode.toDataURL(qr);
      this.io.to(tenantId.toString()).emit('whatsapp_qr', { image: qrBase64 });
    });

    client.on('ready', () => {
      this.sessions.set(tenantId.toString(), { client, status: 'connected' });
      this.io.to(tenantId.toString()).emit('whatsapp_status', { status: 'connected' });
    });

    // Se houver erro na inicialização, removemos do Map para poder tentar de novo
    client.on('auth_failure', () => {
      this.sessions.delete(tenantId.toString());
    });

    try {
      await client.initialize();
    } catch (err) {
      console.error("Erro fatal ao iniciar cliente WhatsApp:", err);
      this.sessions.delete(tenantId.toString());
    }
  }

  async sendMessage(tenantId, to, message) {
    const client = this.sessions.get(tenantId.toString());
    if (client) {
      await client.sendMessage(`${to}@c.us`, message);
    }
  }
}

export default new WppService();