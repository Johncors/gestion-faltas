// src/pages/Empaste.jsx
import React, { useState, useEffect } from 'react';
import { pedidosService } from '../services/api';

const Empaste = () => {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [piezasCompletadas, setPiezasCompletadas] = useState({});

  useEffect(() => {
    cargarPedidos();
  }, []);

  const cargarPedidos = async () => {
    try {
      setLoading(true);
      const { data } = await pedidosService.getPedidos();
      setPedidos(data.filter(p => p.estado === 'empaste'));
      setError(null);
    } catch (err) {
      setError('Error al cargar pedidos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const actualizarPieza = (pedidoId, piezaId, completada) => {
    setPiezasCompletadas(prev => ({
      ...prev,
      [`${pedidoId}-${piezaId}`]: completada
    }));
  };

  const finalizarEmpaste = async (pedidoId) => {
    try {
      setLoading(true);
      await pedidosService.actualizarEstado(pedidoId, 'troquelado');
      setPedidoSeleccionado(null);
      await cargarPedidos();
      setPiezasCompletadas({});
      setError(null);
    } catch (err) {
      setError('Error al finalizar empaste');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const DetallePedido = ({ pedido }) => {
    const todasPiezasCompletadas = pedido.piezas.every(
      pieza => piezasCompletadas[`${pedido._id}-${pieza._id}`]
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
          <h4 className="font-medium">Piezas a Empastar</h4>
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
                  checked={piezasCompletadas[`${pedido._id}-${pieza._id}`] || false}
                  onChange={(e) => actualizarPieza(pedido._id, pieza._id, e.target.checked)}
                  disabled={loading}
                />
                <span className="ml-2">Completado</span>
              </label>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <button
            onClick={() => finalizarEmpaste(pedido._id)}
            disabled={!todasPiezasCompletadas || loading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Procesando...' : 'Finalizar Empaste'}
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
      <h2 className="text-2xl font-bold text-gray-800">Módulo Empaste</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {pedidoSeleccionado ? (
        <DetallePedido pedido={pedidoSeleccionado} />
      ) : (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Pedidos para Empastar</h3>
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
                    Piezas
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {pedido.piezas.length} piezas
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

export default Empaste;