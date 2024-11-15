const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    required: true,
    enum: ['Taller', 'Oficina', 'Empaste', 'Troquelado']
  }
});

module.exports = mongoose.model('User', userSchema);

// server/models/Pedido.js
const mongoose = require('mongoose');

const pedidoSchema = new mongoose.Schema({
  numero: { type: Number, required: true, unique: true },
  modelo: { type: String, required: true },
  color: { type: String, required: true },
  estado: {
    type: String,
    enum: ['pendiente', 'aceptado', 'empaste', 'troquelado', 'completado'],
    default: 'pendiente'
  },
  piezas: [{
    nombre: String,
    cantidad: Number,
    completado: { type: Boolean, default: false }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Pedido', pedidoSchema);