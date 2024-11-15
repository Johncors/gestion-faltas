// src/pages/Troquelado.jsx
import React, { useState, useEffect } from 'react';
import { pedidosService } from '../services/api';

const Troquelado = () => {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [piezasTroqueladas, setPiezasTroqueladas] = useState({});

  useEffect(() => {
    cargarPedidos();
  }, []);

  const cargarPedidos = async () => {
    try {
      setLoading(true);
      const { data } = await pedidosService.getPedidos();
      setPedidos(data.filter(p => p.estado === 'troquelado'));
      setError(null);
    } catch (err) {
      setError('Error al cargar pedidos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const marcarPiezaTroquelada = (pedidoId, piezaId, completada) => {
    setPiezasTroqueladas(prev => ({
      ...prev,
      [`${pedidoId}-${piezaId}`]: completada
    }));
  };

  const calcularProgreso = (pedido) => {
    const total = pedido.piezas.length;
    const completadas = pedido.piezas.filter(
      pieza => piezasTroqueladas[`${pedido._id}-${pieza._id}`]
    ).length;
    return Math.round((completadas / total) * 100);
  };

  const finalizarTroquelado = async (pedidoId) => {
    try {
      setLoading(true);
      await pedidosService.actualizarEstado(pedidoId, 'completado');
      setPedidoSeleccionado(null);
      await cargarPedidos();
      setPiezasTroqueladas({});
      setError(null);
    } catch (err) {
      setError('Error al finalizar troquelado');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const DetallePedido = ({ pedido }) => {
    const todasPiezasTroqueladas = pedido.piezas.every(
      pieza => piezasTroqueladas[`${pedido._id}-${pieza._id}`]
    );

    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium">Pedido #{pedido.numero}</h3>
          <button
            onClick={() => setPedidoSeleccionado(null)}
            className="text-gray-500 hover:text-gray-700"
          >
            Cerrar
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-500">Modelo</p>
            <p className="font-medium">{pedido.modelo}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Color</p>
            <p className="font-medium">{pedido.color}</p>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium">Piezas para Troquelar</h4>
          {pedido.piezas.map((pieza) => (
            <div key={pieza._id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div>
                <span className="font-medium">{pieza.nombre}</span>
                <span className="text-sm text-gray-500 ml-2">({pieza.cantidad} unidades)</span>
              </div>
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  className="form-checkbox h-5 w-5 text-blue-600"
                  checked={piezasTroqueladas[`${pedido._id}-${pieza._id}`] || false}
                  onChange={(e) => marcarPiezaTroquelada(pedido._id, pieza._id, e.target.checked)}
                  disabled={loading}
                />
                <span className="ml-2">Troquelado</span>
              </label>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <button
            onClick={() => finalizarTroquelado(pedido._id)}
            disabled={!todasPiezasTroqueladas || loading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Procesando...' : 'Finalizar Troquelado'}
          </button>
        </div>
      </div>
    );
  };

  if (loading && !pedidos.length) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Módulo Troquelado</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {pedidoSeleccionado ? (
        <DetallePedido pedido={pedidoSeleccionado} />
      ) : (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Pedidos para Troquelar</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Número
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Modelo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Color
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progreso
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pedidos.map((pedido) => (
                  <tr key={pedido._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {pedido.numero}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {pedido.modelo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {pedido.color}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-blue-600 h-2.5 rounded-full"
                          style={{ width: `${calcularProgreso(pedido)}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setPedidoSeleccionado(pedido)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Procesar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Troquelado;