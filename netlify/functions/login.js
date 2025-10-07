const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Método no permitido' }) };
  }

  try {
    const { username, password } = JSON.parse(event.body);

    // --- LOG DE DEPURACIÓN 1 ---
    console.log(`Intento de login para usuario: "${username}" con contraseña: "${password}"`);

    if (!username || !password) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Usuario y contraseña son requeridos.' }) };
    }

    const result = await pool.query('SELECT * FROM credentials WHERE username = $1', [username]);
    const user = result.rows[0];

    if (!user) {
      // --- LOG DE DEPURACIÓN 2 ---
      console.log('Resultado: Usuario no encontrado en la base de datos.');
      return { statusCode: 401, body: JSON.stringify({ error: 'Credenciales inválidas.' }) };
    }

    // --- LOG DE DEPURACIÓN 3 ---
    console.log(`Hash de la BD para "${user.username}": "${user.password_hash}"`);

    const passwordIsValid = bcrypt.compareSync(password, user.password_hash);

    // --- LOG DE DEPURACIÓN 4 ---
    console.log(`Resultado de la comparación de contraseñas (bcrypt): ${passwordIsValid}`);

    if (!passwordIsValid) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Credenciales inválidas.' }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Login exitoso' }),
    };

  } catch (error) {
    console.error('Error en la función de login:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Error interno del servidor.' }) };
  }
};

