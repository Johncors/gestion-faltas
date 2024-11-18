// src/pages/Oficina.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const Oficina = () => {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtro, setFiltro] = useState('');
  const [pedidosFiltrados, setPedidosFiltrados] = useState([]);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [mostrarDetalle, setMostrarDetalle] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const recargarPedidos = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await axios.get('http://localhost:3001/api/pedidos', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const pedidosOrdenados = data.sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );
      setPedidos(pedidosOrdenados);
      setPedidosFiltrados(pedidosOrdenados);
      setError(null);
    } catch (err) {
      setError('Error al cargar pedidos');
      console.error(err);
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  }, []);

  // Auto-recarga y carga inicial
  useEffect(() => {
    recargarPedidos();
    const intervalo = setInterval(recargarPedidos, 30000);
    return () => clearInterval(intervalo);
  }, [recargarPedidos]);

  // Filtrado de pedidos
  useEffect(() => {
    const resultado = pedidos.filter(pedido => 
      pedido.numero.toString().includes(filtro) ||
      pedido.modelo.toLowerCase().includes(filtro.toLowerCase()) ||
      pedido.color.toLowerCase().includes(filtro.toLowerCase())
    );
    setPedidosFiltrados(resultado);
  }, [filtro, pedidos]);

  const aceptarPedido = async (pedidoId) => {
    try {
      await axios.put(
        `http://localhost:3001/api/pedidos/${pedidoId}/estado`,
        { 
          estado: 'aceptado',
          fecha_aceptacion: new Date()
        },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      await recargarPedidos();
      setMostrarDetalle(false);
    } catch (err) {
      console.error('Error:', err);
      alert('Error al procesar el pedido');
    }
  };

  const recibirPedido = async (pedidoId) => {
    try {
      await axios.put(
        `http://localhost:3001/api/pedidos/${pedidoId}/estado`,
        { 
          estado: 'recibido',
          fecha_recepcion: new Date()
        },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      await recargarPedidos();
      setMostrarDetalle(false);
    } catch (err) {
      console.error('Error:', err);
      alert('Error al procesar el pedido');
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'pendiente':
        return 'bg-red-100 text-red-800';
      case 'aceptado':
        return 'bg-orange-100 text-orange-800';
      case 'recibido':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEstadoTexto = (estado) => {
    switch (estado) {
      case 'pendiente':
        return 'Pendiente de Aceptar';
      case 'aceptado':
        return 'Aceptado';
      case 'recibido':
        return 'Recibido en Oficina';
      default:
        return estado;
    }
  };

  if (loading) return <div className="text-center p-4">Cargando...</div>;
  if (error) return <div className="text-red-500 text-center p-4">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {/* Buscador */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Pedidos</h2>
              <div className="flex gap-4 items-center">
                <button
                  onClick={recargarPedidos}
                  disabled={isLoading}
                  className={`p-2 rounded-full ${
                    isLoading ? 'bg-gray-300' : 'bg-blue-500 hover:bg-blue-600'
                  } text-white`}
                >
                  {isLoading ? (
                    <span className="inline-block animate-spin">↻</span>
                  ) : (
                    <span>↻</span>
                  )}
                </button>
                <input
                  type="text"
                  placeholder="Buscar por número, modelo o color..."
                  className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-80"
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                />
              </div>
            </div>
          </div>

      {/* Lista de Pedidos */}
      <div className="bg-white shadow rounded-lg p-6">
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
                  Solicitante
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Pedido
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pedidosFiltrados.length > 0 ? (
                pedidosFiltrados.map((pedido) => (
                  <tr 
                    key={pedido.id}
                    onClick={() => {
                      setPedidoSeleccionado(pedido);
                      setMostrarDetalle(true);
                    }}
                    className={`cursor-pointer hover:bg-gray-50 border-l-4 ${
                      pedido.estado === 'pendiente' ? 'border-red-500' : 
                      pedido.estado === 'aceptado' ? 'border-orange-500' : 
                      'border-green-500'
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {pedido.numero}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {pedido.modelo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {pedido.color}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {pedido.usuario_nombre || 'No asignado'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(pedido.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-4 py-2 rounded-full ${
                        pedido.estado === 'pendiente' ? 'bg-red-100 text-red-800' : 
                        pedido.estado === 'aceptado' ? 'bg-orange-100 text-orange-800' : 
                        'bg-green-100 text-green-800'
                      }`}>
                        {getEstadoTexto(pedido.estado)}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    {filtro ? "No se encontraron pedidos que coincidan con la búsqueda" : "No hay pedidos disponibles"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Detalle */}
      {mostrarDetalle && pedidoSeleccionado && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-3xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-medium text-gray-900">
                  Detalle del Pedido #{pedidoSeleccionado.numero}
                </h3>
                <button
                  onClick={() => setMostrarDetalle(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>

              <div className="grid grid-cols-4 gap-4 mb-6">
                <div>
                  <p className="text-sm font-medium text-gray-500">Modelo</p>
                  <p className="mt-1">{pedidoSeleccionado.modelo}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Color</p>
                  <p className="mt-1">{pedidoSeleccionado.color}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Solicitante</p>
                  <p className="mt-1">{pedidoSeleccionado.usuario_nombre}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Estado</p>
                  <span className={`mt-1 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    pedidoSeleccionado.estado === 'pendiente' ? 'bg-red-100 text-red-800' : 
                    pedidoSeleccionado.estado === 'aceptado' ? 'bg-orange-100 text-orange-800' : 
                    'bg-green-100 text-green-800'
                  }`}>
                    {getEstadoTexto(pedidoSeleccionado.estado)}
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-lg font-medium mb-2">Historial</h4>
                <div className="space-y-2 text-sm">
                  <p>Creado: {new Date(pedidoSeleccionado.created_at).toLocaleString()}</p>
                  {pedidoSeleccionado.fecha_aceptacion && (
                    <p>Aceptado: {new Date(pedidoSeleccionado.fecha_aceptacion).toLocaleString()}</p>
                  )}
                  {pedidoSeleccionado.fecha_recepcion && (
                    <p>Recibido: {new Date(pedidoSeleccionado.fecha_recepcion).toLocaleString()}</p>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-lg font-medium mb-2">Desglose de Piezas</h4>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pieza</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {pedidoSeleccionado.piezas.map((pieza, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 text-sm text-gray-900">{pieza.nombre}</td>
                        <td className="px-6 py-4 text-sm text-gray-900 text-right">{pieza.cantidad}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Botones de acción */}
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => setMostrarDetalle(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cerrar
                </button>
                
                {pedidoSeleccionado.estado === 'pendiente' && (
                  <button
                    onClick={() => aceptarPedido(pedidoSeleccionado.id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Aceptar Pedido
                  </button>
                )}
                
                {pedidoSeleccionado.estado === 'aceptado' && (
                  <button
                    onClick={() => recibirPedido(pedidoSeleccionado.id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Marcar como Recibido
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Oficina;