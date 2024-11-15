// src/services/dataService.js
export const loadModelos = async () => {
    try {
      const response = await fetch('/data/modelos.csv');
      const text = await response.text();
      const lines = text.split('\n').slice(1); // Ignorar encabezado
      
      const modelosMap = {};
      lines.forEach(line => {
        const [nombre, componentes] = line.split(',');
        if (nombre && componentes) {
          modelosMap[nombre.trim()] = componentes
            .replace(/"/g, '')
            .split(',')
            .map(comp => comp.trim())
            .filter(comp => comp);
        }
      });
      
      return modelosMap;
    } catch (error) {
      console.error('Error cargando modelos:', error);
      return {};
    }
  };
  
  export const loadColores = async () => {
    try {
      const response = await fetch('/data/color.txt');
      const text = await response.text();
      return text.split('\n').map(color => color.trim()).filter(color => color);
    } catch (error) {
      console.error('Error cargando colores:', error);
      return [];
    }
  };