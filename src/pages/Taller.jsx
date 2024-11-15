// src/pages/Taller.jsx
import React, { useState, useEffect } from 'react';
import { pedidosService } from '../services/api';

const Taller = () => {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pedido, setPedido] = useState({
    modelo: '',
    color: '',
    piezas: []
  });
  const [modelos] = useState(['Modelo A', 'Modelo B', 'Modelo C']); // Temporal hasta tener CSV
  const [colores] = useState(['Rojo', 'Azul', 'Verde']); // Temporal hasta tener CSV

  useEffect(() => {
    cargarPedidos();
  }, []);

  const cargarPedidos = async () => {
    try {
      setLoading(true);
      const { data } = await pedidosService.getPedidos();
      setPedidos(data);
      setError(null);
    } catch (err) {
      setError('Error al cargar pedidos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await pedidosService.crearPedido(pedido);
      setPedido({ modelo: '', color: '', piezas: [] });
      await cargarPedidos();
      setError(null);
    } catch (err) {
      setError('Error al crear pedido');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const marcarRecibido = async (pedidoId) => {
    try {
      setLoading(true);
      await pedidosService.actualizarEstado(pedidoId, 'completado');
      await cargarPedidos();
      setError(null);
    } catch (err) {
      setError('Error al actualizar estado');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !pedidos.length) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Módulo Taller</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Formulario Nuevo Pedido */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Nuevo Pedido</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Modelo</label>
            <select 
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={pedido.modelo}
              onChange={(e) => setPedido({...pedido, modelo: e.target.value})}
              required
            >
              <option value="">Seleccionar modelo...</option>
              {modelos.map((modelo) => (
                <option key={modelo} value={modelo}>{modelo}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Color</label>
            <select 
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={pedido.color}
              onChange={(e) => setPedido({...pedido, color: e.target.value})}
              required
            >
              <option value="">Seleccionar color...</option>
              {colores.map((color) => (
                <option key={color} value={color}>{color}</option>
              ))}
            </select>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Creando...' : 'Crear Pedido'}
          </button>
        </form>
      </div>

      {/* Lista de Pedidos Activos */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Pedidos Activos</h3>
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
                  Estado
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
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${pedido.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' : 
                        pedido.estado === 'completado' ? 'bg-green-100 text-green-800' : 
                        'bg-blue-100 text-blue-800'}`}>
                      {pedido.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {pedido.estado === 'troquelado' && (
                      <button
                        onClick={() => marcarRecibido(pedido._id)}
                        disabled={loading}
                        className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                      >
                        Marcar Recibido
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Taller;