const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
  
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Error de validación',
        errors: Object.values(err.errors).map(e => e.message)
      });
    }
  
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        message: 'Registro duplicado'
      });
    }
  
    res.status(500).json({
      message: 'Error interno del servidor'
    });
  };
  
  module.exports = errorHandler;