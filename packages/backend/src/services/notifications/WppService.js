import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode';

class WppService {
  constructor() {
    this.client = null;
    this.qrCodeBase64 = null;
    this.status = 'disconnected';
    this.io = null;
  }

  // Inicializa o serviço e vincula ao Socket.io para mandar o QR Code pro React
  initialize(io) {
    this.io = io;
    this.client = new Client({
      authStrategy: new LocalAuth({ clientId: "calango-food-session" }),
      puppeteer: { 
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: true 
      }
    });

    this.client.on('qr', async (qr) => {
      this.status = 'waiting_qr';
      // Converte o texto do QR em imagem Base64 para o Chakra UI exibir
      this.qrCodeBase64 = await qrcode.toDataURL(qr);
      this.io.emit('whatsapp_qr', { image: this.qrCodeBase64 });
      console.log('🐊 Calango-food: QR Code gerado. Aguardando leitura...');
    });

    this.client.on('ready', () => {
      this.status = 'connected';
      this.qrCodeBase64 = null;
      this.io.emit('whatsapp_status', { status: 'connected' });
      console.log('✅ Calango-food: WhatsApp conectado com sucesso!');
    });

    this.client.on('disconnected', () => {
      this.status = 'disconnected';
      this.io.emit('whatsapp_status', { status: 'disconnected' });
      this.client.initialize(); // Tenta reiniciar
    });

    this.client.initialize();
  }

  async sendMessage(to, message) {
    if (this.status !== 'connected') {
      console.error("❌ Erro: WhatsApp não está conectado.");
      return false;
    }
    const formattedId = `${to.replace(/\D/g, '')}@c.us`;
    return this.client.sendMessage(formattedId, message);
  }
}

export default new WppService();