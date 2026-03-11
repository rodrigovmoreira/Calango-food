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
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: true
      }
    });

    // Marcamos como iniciando
    this.sessions.set(tenantId.toString(), { client, status: 'connecting' });

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