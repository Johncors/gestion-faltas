// server/controllers/pedidosController.js
const db = require('../config/database');

const getPedidos = async (req, res) => {
  try {
    // Consulta con JOIN para obtener el nombre del usuario
    const [pedidos] = await db.query(`
      SELECT p.*, u.username as usuario_nombre, 
             GROUP_CONCAT(pi.nombre, ':', pi.cantidad) as piezas_info
      FROM pedidos p
      LEFT JOIN usuarios u ON p.usuario_id = u.id
      LEFT JOIN piezas pi ON p.id = pi.pedido_id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `);

    const pedidosFormateados = pedidos.map(pedido => ({
      ...pedido,
      usuario_nombre: pedido.usuario_nombre || 'No asignado',
      piezas: pedido.piezas_info ? 
        pedido.piezas_info.split(',').map(pieza => {
          const [nombre, cantidad] = pieza.split(':');
          return { nombre, cantidad: parseInt(cantidad) };
        }) : []
    }));

    res.json(pedidosFormateados);
  } catch (error) {
    console.error('Error al obtener pedidos:', error);
    res.status(500).json({ message: 'Error al obtener pedidos' });
  }
};

const crearPedido = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    
    const { numero, modelo, color, componentes } = req.body;
    const usuario_id = req.user.id; // Obtenido del token JWT

    // Verificar si el número de pedido ya existe
    const [existente] = await connection.query(
      'SELECT id FROM pedidos WHERE numero = ?',
      [numero]
    );

    if (existente.length > 0) {
      throw new Error('El número de pedido ya existe');
    }

    // Crear el pedido
    const [result] = await connection.query(
      'INSERT INTO pedidos (numero, modelo, color, usuario_id, estado) VALUES (?, ?, ?, ?, "pendiente")',
      [numero, modelo, color, usuario_id]
    );

    const pedido_id = result.insertId;

    // Insertar los componentes
    for (const componente of componentes) {
      await connection.query(
        'INSERT INTO piezas (pedido_id, nombre, cantidad) VALUES (?, ?, ?)',
        [pedido_id, componente.nombre, componente.cantidad]
      );
    }

    await connection.commit();
    res.status(201).json({ 
      id: pedido_id, 
      mensaje: 'Pedido creado exitosamente' 
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error al crear pedido:', error);
    res.status(500).json({ 
      message: error.message || 'Error al crear el pedido' 
    });
  } finally {
    connection.release();
  }
};

const actualizarEstado = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    const { estado } = req.body;
    const fecha_actual = new Date();
    
    // Determinar qué campo de fecha actualizar
    let fechaField = '';
    switch (estado) {
      case 'aceptado':
        fechaField = 'fecha_aceptacion';
        break;
      case 'recibido':
        fechaField = 'fecha_recepcion';
        break;
      default:
        fechaField = 'updated_at';
    }

    // Actualizar el estado y la fecha correspondiente
    await connection.query(
      `UPDATE pedidos SET estado = ?, ${fechaField} = ? WHERE id = ?`,
      [estado, fecha_actual, id]
    );

    await connection.commit();
    
    // Obtener el pedido actualizado
    const [pedidoActualizado] = await connection.query(
      `SELECT p.*, u.username as usuario_nombre
       FROM pedidos p
       LEFT JOIN usuarios u ON p.usuario_id = u.id
       WHERE p.id = ?`,
      [id]
    );

    res.json({
      message: 'Estado actualizado exitosamente',
      pedido: pedidoActualizado[0]
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error al actualizar estado:', error);
    res.status(500).json({ message: 'Error al actualizar estado' });
  } finally {
    connection.release();
  }
};

// Opcional: Obtener un pedido específico
const getPedido = async (req, res) => {
  try {
    const { id } = req.params;
    const [pedidos] = await db.query(`
      SELECT p.*, u.username as usuario_nombre,
             GROUP_CONCAT(pi.nombre, ':', pi.cantidad) as piezas_info
      FROM pedidos p
      LEFT JOIN usuarios u ON p.usuario_id = u.id
      LEFT JOIN piezas pi ON p.id = pi.pedido_id
      WHERE p.id = ?
      GROUP BY p.id
    `, [id]);

    if (pedidos.length === 0) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    const pedido = {
      ...pedidos[0],
      usuario_nombre: pedidos[0].usuario_nombre || 'No asignado',
      piezas: pedidos[0].piezas_info ? 
        pedidos[0].piezas_info.split(',').map(pieza => {
          const [nombre, cantidad] = pieza.split(':');
          return { nombre, cantidad: parseInt(cantidad) };
        }) : []
    };

    res.json(pedido);
  } catch (error) {
    console.error('Error al obtener pedido:', error);
    res.status(500).json({ message: 'Error al obtener pedido' });
  }
};

module.exports = {
  getPedidos,
  getPedido,
  crearPedido,
  actualizarEstado
};