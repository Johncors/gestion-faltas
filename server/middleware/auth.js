// server/middleware/auth.js
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'Token no proporcionado' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [users] = await db.query('SELECT id, username, role FROM usuarios WHERE id = ?', [decoded.userId]);
    
    if (users.length === 0) throw new Error();
    req.user = users[0];
    next();
  } catch (error) {
    res.status(401).json({ message: 'No autorizado' });
  }
};

const checkRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Acceso denegado' });
    }
    next();
  };
};

module.exports = { auth, checkRole };