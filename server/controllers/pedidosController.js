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
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    
    const { modelo, color, piezas } = req.body;
    const usuario_id = req.user.id;

    const [numeroResult] = await conn.query('SELECT MAX(numero) as ultimo FROM pedidos');
    const numero = (numeroResult[0].ultimo || 0) + 1;

    const [pedidoResult] = await conn.query(
      'INSERT INTO pedidos (numero, modelo, color, usuario_id) VALUES (?, ?, ?, ?)',
      [numero, modelo, color, usuario_id]
    );

    for (const pieza of piezas) {
      await conn.query(
        'INSERT INTO piezas (pedido_id, nombre, cantidad) VALUES (?, ?, ?)',
        [pedidoResult.insertId, pieza.nombre, pieza.cantidad]
      );
    }

    await conn.commit();
    res.status(201).json({ 
      id: pedidoResult.insertId,
      numero,
      mensaje: 'Pedido creado exitosamente' 
    });
  } catch (error) {
    await conn.rollback();
    res.status(500).json({ message: 'Error al crear pedido' });
  } finally {
    conn.release();
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