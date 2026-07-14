import jwt from 'jsonwebtoken';

export const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      console.log('❌ [AuthMiddleware] Falha: Requisição sem token de acesso.');
      return res.status(401).json({ message: 'Você não está logado.' });
    }

    const secret = process.env.JWT_SECRET_LOGIN || 'super_secret_jwt_key_calango_inc';
    const decoded = jwt.verify(token, secret);

    req.tenantId = decoded.uid;
    req.user = { id: decoded.uid, email: decoded.email };
    next();
  } catch (err) {
    console.error(`❌ [AuthMiddleware] Falha na validação do Token: ${err.message}`);
    res.status(401).json({ message: 'Token inválido ou expirado.' });
  }
};
