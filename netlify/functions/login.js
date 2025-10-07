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

    if (!username || !password) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Usuario y contraseña son requeridos.' }) };
    }

    // --- CÓDIGO DE DIAGNÓSTICO ---
    console.log(`[Paso 1] Contraseña recibida del navegador: "${password}"`);

    const result = await pool.query('SELECT password_hash FROM credentials WHERE username = $1', [username]);
    const user = result.rows[0];

    if (!user) {
      console.log('[Error] El usuario no fue encontrado en la base de datos.');
      return { statusCode: 401, body: JSON.stringify({ error: 'Credenciales inválidas.' }) };
    }

    const hashFromDB = user.password_hash;
    console.log(`[Paso 2] Hash recuperado de la Base de Datos: "${hashFromDB}"`);
    
    // Generamos un hash de la contraseña que nos llegó para comparar
    const salt = bcrypt.genSaltSync(10);
    const freshlyGeneratedHash = bcrypt.hashSync(password, salt);
    console.log(`[Paso 3] Hash recién generado a partir de la contraseña: "${freshlyGeneratedHash}"`);
    
    // Comparamos el hash de la BD con la contraseña recibida
    const passwordIsValid = bcrypt.compareSync(password, hashFromDB);
    console.log(`[Paso 4] Resultado de bcrypt.compareSync: ${passwordIsValid}`);
    // --- FIN DEL CÓDIGO DE DIAGNÓSTICO ---

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

