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

    // --- PRUEBA DE DIAGNÓSTICO ---
    // Ignoraremos temporalmente el hash de la base de datos y usaremos uno de control.
    // Este hash corresponde a la contraseña "diego".
    const correctHashForDiego = '$2a$10$iE.IVt.3O/IIk23s34S/X.w9g8zFq4bJp5kL1kE7vR6nZ2lU1vV9.';
    
    // Primero, verificamos que el usuario "admin" exista.
    if (username.toLowerCase() !== 'admin') {
        return { statusCode: 401, body: JSON.stringify({ error: 'Usuario incorrecto.' }) };
    }

    // Luego, comparamos la contraseña que nos envían con nuestro hash de control.
    const passwordIsValid = bcrypt.compareSync(password, correctHashForDiego);

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

