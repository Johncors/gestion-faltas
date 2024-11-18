const db = require('../config/database');

const getPedidos = async (req, res) => {
  try {
    const [pedidos] = await db.query(`
      SELECT p.*, GROUP_CONCAT(pi.id, ':', pi.nombre, ':', pi.cantidad, ':', pi.completado) as piezas_info
      FROM pedidos p
      LEFT JOIN piezas pi ON p.id = pi.pedido_id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `);

    const pedidosFormateados = pedidos.map(pedido => ({
      ...pedido,
      piezas: pedido.piezas_info ? pedido.piezas_info.split(',').map(pieza => {
        const [id, nombre, cantidad, completado] = pieza.split(':');
        return { id, nombre, cantidad: parseInt(cantidad), completado: completado === '1' };
      }) : []
    }));

    res.json(pedidosFormateados);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener pedidos' });
  }
};

const crearPedido = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    
    const { numero, modelo, color, componentes } = req.body;
    
    // Log para debugging
    console.log('Recibiendo pedido:', { numero, modelo, color, componentes });

    // Verificar datos requeridos
    if (!numero || !modelo || !color || !componentes) {
      throw new Error('Faltan datos requeridos');
    }

    // Verificar si el número ya existe
    const [existente] = await connection.query(
      'SELECT id FROM pedidos WHERE numero = ?',
      [numero]
    );

    if (existente.length > 0) {
      throw new Error('El número de pedido ya existe');
    }

    // Insertar pedido
    const [result] = await connection.query(
      `INSERT INTO pedidos (numero, modelo, color, estado) 
       VALUES (?, ?, ?, 'pendiente')`,
      [numero, modelo, color]
    );

    const pedidoId = result.insertId;

    // Insertar componentes
    for (const componente of componentes) {
      if (componente.cantidad > 0) {
        await connection.query(
          'INSERT INTO piezas (pedido_id, nombre, cantidad) VALUES (?, ?, ?)',
          [pedidoId, componente.nombre, componente.cantidad]
        );
      }
    }

    await connection.commit();
    res.status(201).json({ 
      message: 'Pedido creado exitosamente',
      pedidoId 
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error en crearPedido:', error);
    res.status(500).json({ 
      message: error.message || 'Error al crear el pedido' 
    });
  } finally {
    connection.release();
  }
};

const actualizarEstado = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    
    const { id } = req.params;
    const { estado, piezas } = req.body;
    
    await conn.query('UPDATE pedidos SET estado = ? WHERE id = ?', [estado, id]);

    if (piezas) {
      for (const pieza of piezas) {
        await conn.query(
          'UPDATE piezas SET completado = ? WHERE id = ? AND pedido_id = ?',
          [pieza.completado, pieza.id, id]
        );
      }
    }

    await conn.commit();
    res.json({ message: 'Estado actualizado exitosamente' });
  } catch (error) {
    await conn.rollback();
    res.status(500).json({ message: 'Error al actualizar estado' });
  } finally {
    conn.release();
  }
};

module.exports = {
  getPedidos,
  crearPedido,
  actualizarEstado
};