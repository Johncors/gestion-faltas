const express = require('express');
const router = express.Router();
const { getPedidos, crearPedido, actualizarEstado } = require('../controllers/pedidosController');
const { auth, checkRole } = require('../middleware/auth');
router.use(auth);
router.get('/', getPedidos);
router.post('/', checkRole(['Taller']), crearPedido);
router.put('/:id/estado', actualizarEstado);

module.exports = router;