// server/hashPassword.js
const bcrypt = require('bcryptjs');

const password = '1234';
const hashedPassword = bcrypt.hashSync(password, 10);
console.log('Contraseña:', password);
console.log('Hash:', hashedPassword);