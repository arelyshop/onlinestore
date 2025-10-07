const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Configuración de la conexión a la base de datos usando la variable de entorno
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

exports.handler = async (event) => {
  // Solo permitir peticiones POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Método no permitido' }) };
  }

  try {
    const { username, password } = JSON.parse(event.body);

    if (!username || !password) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Usuario y contraseña son requeridos.' }) };
    }

    // Buscar al usuario en la base de datos
    const result = await pool.query('SELECT * FROM credentials WHERE username = $1', [username]);
    const user = result.rows[0];

    // Si el usuario no existe, las credenciales son inválidas
    if (!user) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Credenciales inválidas.' }) };
    }

    // Comparar la contraseña enviada con el hash guardado en la BD
    const passwordIsValid = bcrypt.compareSync(password, user.password_hash);

    if (!passwordIsValid) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Credenciales inválidas.' }) };
    }

    // Si todo es correcto, enviar una respuesta exitosa
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Login exitoso' }),
    };

  } catch (error) {
    console.error('Error en la función de login:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Error interno del servidor.' }) };
  }
};

