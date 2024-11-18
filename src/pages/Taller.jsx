// src/pages/Taller.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Taller = () => {
  
  const [modelos, setModelos] = useState({});
  const [colores, setColores] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [pedidosFiltrados, setPedidosFiltrados] = useState([]);
  const [pedidoActual, setPedidoActual] = useState({
    numero: '', 
    modelo: '',
    color: '',
    componentes: []
  });
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        // Cargar colores
        const responseColores = await fetch('/data/color.txt');
        const textColores = await responseColores.text();
        const coloresList = textColores.split('\n').filter(color => color.trim());
        setColores(coloresList);

        // Cargar modelos
        const responseModelos = await fetch('/data/modelos.csv');
        const textModelos = await responseModelos.text();
        const lines = textModelos.split('\n').slice(1); // Ignorar encabezado
        
        const modelosMap = {};
        lines.forEach(line => {
          if (line.trim()) {
            const matches = line.match(/"([^"]+)"|[^,]+/g);
            if (matches && matches.length >= 2) {
              const nombre = matches[0].trim();
              const componentesStr = matches[1].replace(/"/g, '');
              modelosMap[nombre] = componentesStr
                .split(',')
                .map(comp => comp.trim())
                .filter(comp => comp);
            }
          }
        });
        
        setModelos(modelosMap);

        // Cargar pedidos
        const responsePedidos = await axios.get('http://localhost:3001/api/pedidos', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        setPedidos(responsePedidos.data);

      } catch (err) {
        setError('Error al cargar datos');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

  const handleModeloChange = (e) => {
    const modelo = e.target.value;
    console.log('Componentes del modelo:', modelos[modelo]);
    setPedidoActual({
      ...pedidoActual,
      modelo,
      componentes: modelos[modelo]?.map(comp => ({
        nombre: comp,
        cantidad: 0
      })) || []
    });
  };

  const guardarPedido = async () => {
    try {
      if (!pedidoActual.numero) {
        alert('Por favor ingrese el número de pedido');
        return;
      }
  
      if (!pedidoActual.modelo || !pedidoActual.color) {
        alert('Por favor seleccione modelo y color');
        return;
      }
  
      // Log para debugging
      console.log('Enviando pedido:', pedidoActual);
  
      const pedidoParaEnviar = {
        numero: parseInt(pedidoActual.numero),
        modelo: pedidoActual.modelo,
        color: pedidoActual.color,
        componentes: pedidoActual.componentes
          .filter(c => c.cantidad > 0)
          .map(c => ({
            nombre: c.nombre,
            cantidad: parseInt(c.cantidad)
          }))
      };
  
      const response = await axios.post(
        'http://localhost:3001/api/pedidos', 
        pedidoParaEnviar,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );
  
      if (response.status === 201) {
        alert('Pedido guardado exitosamente');
        setPedidoActual({
          numero: '',
          modelo: '',
          color: '',
          componentes: []
        });
        
        // Recargar pedidos
        const { data: nuevosPedidos } = await axios.get('http://localhost:3001/api/pedidos', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        setPedidos(nuevosPedidos);
      }
    } catch (error) {
      console.error('Error detallado:', error.response?.data);
      alert(error.response?.data?.message || 'Error al guardar el pedido');
    }
  };

  const handleMarcarRecibido = async (pedidoId) => {
    try {
      await axios.put(`http://localhost:3001/api/pedidos/${pedidoId}/estado`, 
        { estado: 'completado' },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      // Recargar la lista de pedidos
      const newPedidos = await axios.get('http://localhost:3001/api/pedidos', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setPedidos(newPedidos.data);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al marcar como recibido');
    }
  };

  const filtrarPedidos = (pedidos, busqueda) => {
    if (!busqueda) return pedidos;
    
    const searchTerm = busqueda.toLowerCase();
    return pedidos.filter(pedido => 
      pedido.numero?.toString().includes(searchTerm) ||
      pedido.modelo?.toLowerCase().includes(searchTerm) ||
      pedido.color?.toLowerCase().includes(searchTerm) ||
      pedido.estado?.toLowerCase().includes(searchTerm)
    );
  };
  
  useEffect(() => {
    setPedidosFiltrados(filtrarPedidos(pedidos, filtro));
  }, [pedidos, filtro]);

  if (loading) return <div className="text-center p-4">Cargando...</div>;
  if (error) return <div className="text-red-500 text-center p-4">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-8">
      {/* Formulario de Nuevo Pedido */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-6">Nuevo Pedido</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Número de Pedido
        </label>
        <input
          type="text"
          required
          className="w-full border border-gray-300 rounded-md p-2"
          placeholder="Número de pedido"
          value={pedidoActual.numero}
          onChange={(e) => setPedidoActual({...pedidoActual, numero: e.target.value})}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Modelo
        </label>
        <select
          className="w-full border border-gray-300 rounded-md p-2"
          value={pedidoActual.modelo}
          onChange={handleModeloChange}
        >
          <option value="">Seleccionar modelo...</option>
          {Object.keys(modelos).map(modelo => (
            <option key={modelo} value={modelo}>{modelo}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Color
        </label>
        <select
          className="w-full border border-gray-300 rounded-md p-2"
          value={pedidoActual.color}
          onChange={(e) => setPedidoActual({...pedidoActual, color: e.target.value})}
        >
          <option value="">Seleccionar color...</option>
          {colores.map(color => (
            <option key={color} value={color}>{color}</option>
          ))}
        </select>
      </div>
    </div>

        {pedidoActual.modelo && (
          
          <div>
            <h3 className="text-lg font-medium mb-4">Componentes</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Componente
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cantidad
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pedidoActual.componentes.map((componente, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {componente.nombre}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <input
                          type="number"
                          min="0"
                          className="w-24 border border-gray-300 rounded p-1 text-right"
                          value={componente.cantidad}
                          onChange={(e) => {
                            const nuevosComponentes = [...pedidoActual.componentes];
                            nuevosComponentes[index].cantidad = parseInt(e.target.value) || 0;
                            setPedidoActual({...pedidoActual, componentes: nuevosComponentes});
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              className="w-full mt-6 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
              onClick={guardarPedido}
            >
              Guardar Pedido
            </button>
          </div>
        )}
      </div>

      {/* Lista de Pedidos Activos */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Pedidos Activos</h2>
          <div className="flex gap-4 items-center">
            <input
              type="text"
              placeholder="Buscar por número, modelo, color o estado..."
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-80"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
            />
          </div>
        </div>
        
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
                  Fecha
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
            {pedidosFiltrados.length > 0 ? (
              pedidosFiltrados.map((pedido) => (
                <tr key={pedido.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {pedido.numero}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {pedido.modelo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
                    {new Date(pedido.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    {pedido.estado === 'troquelado' && (
                      <button
                        onClick={() => handleMarcarRecibido(pedido.id)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Marcar Recibido
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                  {filtro ? "No se encontraron pedidos que coincidan con la búsqueda" : "No hay pedidos activos"}
                </td>
              </tr>
            )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Taller;