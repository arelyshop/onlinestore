// functions/get-products.js

// Importamos el cliente de PostgreSQL
const { Pool } = require('pg');

exports.handler = async (event, context) => {
  // Obtenemos la URL de conexión desde las variables de entorno de Netlify
  const connectionString = process.env.DATABASE_URL;
  
  // Creamos un nuevo pool de conexiones
  const pool = new Pool({
    connectionString,
  });

  try {
    // Hacemos una consulta a la base de datos para obtener todos los productos
    const { rows } = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
    
    // Cerramos la conexión
    await pool.end();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // Permitir peticiones desde cualquier origen
      },
      // Devolvemos los productos en formato JSON
      body: JSON.stringify(rows),
    };
  } catch (error) {
    console.error('Error fetching products:', error);
    // Cerramos la conexión en caso de error
    await pool.end();
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch products' }),
    };
  }
};
