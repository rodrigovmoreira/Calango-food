const SystemUser = require('../models/SystemUser');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Criando o usuário no MongoDB (Collection: systemusers)
    const newUser = await SystemUser.create({
      name,
      email,
      password,
      role: 'vendedor' // Valor padrão definido no seu Model
    });

    // Gerando o token com o ID do usuário (que será o tenantId)
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    res.status(201).json({
      status: 'success',
      token,
      data: { user: newUser }
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};