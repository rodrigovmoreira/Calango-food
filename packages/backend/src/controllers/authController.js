import SystemUser from '../models/SystemUser.js';
import jwt from 'jsonwebtoken';

// Função auxiliar para criar o Token
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret-calango', {
    expiresIn: '7d',
  });
};

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 1. Verifica se o usuário já existe
    const existingUser = await SystemUser.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Este e-mail já está cadastrado.' });
    }

    // 2. Cria o usuário (o password será hasheado pelo pre-save do Model)
    const newUser = await SystemUser.create({
      name,
      email,
      password,
    });

    // 3. Gera o Token e envia
    const token = signToken(newUser._id);
    res.status(201).json({
      status: 'success',
      token,
      user: { id: newUser._id, name: newUser.name, email: newUser.email }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Busca o usuário forçando a vinda do password
    const user = await SystemUser.findOne({ email }).select('+password');

    // 2. Verificamos se o usuário existe e passamos a senha explicitamente
    if (!user || !(await user.correctPassword(password, user.password))) {
      return res.status(401).json({ message: 'E-mail ou senha incorretos.' });
    }

    const token = signToken(user._id);
    res.status(200).json({
      status: 'success',
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    // No seu middleware de proteção, o ID do usuário logado é injetado como req.tenantId ou req.userId
    // Certifique-se de usar o mesmo nome definido no seu middleware de 'protect'
    const userId = req.tenantId || req.userId; 

    const user = await SystemUser.findById(userId);
    
    // Se o usuário não existe, retornamos 404 em vez de deixar o código quebrar e dar 500
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    res.json({
      id: user._id, 
      name: user.name, 
      email: user.email,
      storeName: user.storeName || 'Calango Food Delivery', 
      slug: user.slug,
      isOpen: user.isOpen ?? true, 
      operatingHours: user.operatingHours || []
    });
  } catch (err) {
    // Isso vai te mostrar no console do terminal EXATAMENTE o que quebrou
    console.error("Erro no getProfile:", err); 
    res.status(500).json({ message: 'Erro interno ao buscar perfil', error: err.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { storeName, isOpen, operatingHours } = req.body;
    
    // 1. Buscamos o usuário pelo tenantId (id do logado)
    const user = await SystemUser.findById(req.tenantId);
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });

    // 2. Atualizamos os campos manualmente para disparar o middleware 'save'
    if (storeName !== undefined) user.storeName = storeName;
    if (isOpen !== undefined) user.isOpen = isOpen;
    if (operatingHours !== undefined) user.operatingHours = operatingHours;

    // 3. Ao salvar, o slug será gerado automaticamente pelo middleware no Model
    await user.save();
    
    res.json({
      id: user._id, 
      name: user.name, 
      email: user.email,
      storeName: user.storeName, 
      slug: user.slug, // Retornamos o slug para o front usar
      isOpen: user.isOpen, 
      operatingHours: user.operatingHours
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getPublicProfile = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const user = await SystemUser.findById(tenantId);
    if (!user) return res.status(404).json({ message: 'Store not found' });
    
    // Calcula se está aberto agora baseado nos horários e no manual isOpen
    let currentlyOpen = false;
    
    if (user.isOpen) {
      if (user.operatingHours && user.operatingHours.length > 0) {
         const now = new Date();
         // Ajuste de Timezone se necessário (simplificado para servidor local)
         const dayOfWeek = now.getDay();
         const todaySchedule = user.operatingHours.find(h => h.day === dayOfWeek);
         
         if (todaySchedule && todaySchedule.isActive) {
            const currentHourMinutes = now.getHours() * 60 + now.getMinutes();
            const [openH, openM] = todaySchedule.openTime.split(':').map(Number);
            const [closeH, closeM] = todaySchedule.closeTime.split(':').map(Number);
            const openMinutes = openH * 60 + openM;
            let closeMinutes = closeH * 60 + closeM;
            
            // Lida com fechamento no dia seguinte (ex: 18:00 as 02:00)
            if (closeMinutes < openMinutes) {
               closeMinutes += 24 * 60;
            }
            let checkMinutes = currentHourMinutes;
            if (openMinutes > closeMinutes && checkMinutes < closeMinutes) { 
                checkMinutes += 24 * 60;
            }
            
            if (checkMinutes >= openMinutes && checkMinutes <= closeMinutes) {
               currentlyOpen = true;
            }
         }
      } else {
         currentlyOpen = true;
      }
    }

    res.json({
      storeName: user.storeName || 'Calango Food',
      isOperatingNow: currentlyOpen
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getPublicMenu = async (req, res) => {
  try {
    const { slug } = req.params;
    
    // Tenta achar por slug ou por ID como fallback
    let user;
    if (slug.match(/^[0-9a-fA-F]{24}$/)) {
      user = await SystemUser.findById(slug);
    } else {
      user = await SystemUser.findOne({ slug });
    }

    if (!user) return res.status(404).json({ message: 'Store not found' });
    
    // Simplificando o envio do status aberto (MenuPages usa OperatingHours para validar no front)
    // Mas também vamos enviar a flag global
    const store = {
      _id: user._id,
      name: user.storeName || user.name || 'Calango Food',
      primaryColor: user.primaryColor,
      logoUrl: user.logoUrl,
      operatingHours: user.operatingHours,
      isOpen: user.isOpen
    };

    const Product = (await import('../models/Product.js')).default;
    const menuItems = await Product.find({ tenantId: user._id, isAvailable: true });

    res.json({
      store,
      menuItems
    });

  } catch (err) {
    console.error('Error fetching public menu:', err);
    res.status(500).json({ message: err.message });
  }
};