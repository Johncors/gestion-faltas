// server/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('Intento de login:', { username, password }); // Para debugging

    const [users] = await db.query('SELECT * FROM usuarios WHERE username = ?', [username]);
    
    if (users.length === 0) {
      console.log('Usuario no encontrado');
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const user = users[0];
    console.log('Usuario encontrado:', { username: user.username, hashedPassword: user.password });

    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log('Contraseña válida:', isValidPassword);

    if (!isValidPassword) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'secretkey',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

module.exports = { login };