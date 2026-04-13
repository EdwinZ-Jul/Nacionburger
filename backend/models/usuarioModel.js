const bcrypt = require('bcrypt');
const { poolPromise, sql } = require('../db');

// REGISTRO TRADICIONAL (Asegura pedir DNI)
async function registrarClienteYUsuario(cliente, usuario) {
  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();
    const request = new sql.Request(transaction);

    // Validación: DNI obligatorio en registro manual
    if (!cliente.dni || cliente.dni.trim() === '') {
      throw new Error('El DNI es obligatorio para el registro manual.');
    }

    const hash = await bcrypt.hash(usuario.contrasena.trim(), 10);

    const clienteResult = await request
      .input('nombres', sql.VarChar(100), cliente.nombres)
      .input('apellidos', sql.VarChar(100), cliente.apellidos)
      .input('dni', sql.VarChar(8), cliente.dni)
      .input('telefono', sql.VarChar(20), cliente.telefono)
      .input('email', sql.VarChar(150), cliente.email)
      .query(`
        INSERT INTO Clientes (NOMBRES, APELLIDOS, DNI, TELEFONO, EMAIL)
        OUTPUT INSERTED.ID_CLIENTE
        VALUES (@nombres, @apellidos, @dni, @telefono, @email)
      `);

    const idCliente = clienteResult.recordset[0].ID_CLIENTE;

    await request
      .input('usuario', sql.VarChar(100), usuario.usuario.trim())
      .input('contrasena', sql.VarChar(255), hash)
      .input('id_cliente', sql.Int, idCliente)
      .query(`
        INSERT INTO Usuarios (USUARIO, CONTRASENA, ID_CLIENTE)
        VALUES (@usuario, @contrasena, @id_cliente)
      `);

    await transaction.commit();
    return { idCliente };

  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

// LOGIN TRADICIONAL
async function loginUsuario(usuario, contrasena) {
  const pool = await poolPromise;

  const result = await pool.request()
    .input('usuario', sql.VarChar(100), usuario.trim())
    .query(`
      SELECT ID_USUARIO, USUARIO, CONTRASENA, TIPO_USUARIO, ID_CLIENTE, ID_TRABAJADOR
      FROM Usuarios
      WHERE USUARIO = @usuario
    `);

  if (result.recordset.length === 0) return null;

  const user = result.recordset[0];

  // Las cuentas exclusivas de Google no tienen contraseña, este login no les sirve
  if (!user.CONTRASENA) return null;

  const passwordValida = await bcrypt.compare(contrasena.trim(), user.CONTRASENA);
  if (!passwordValida) return null;

  delete user.CONTRASENA;
  return user;
}

// BUSCAR USUARIO POR EMAIL
async function findUserByEmail(email) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('email', sql.VarChar, email)
    .query(`
      SELECT email FROM clientes WHERE email = @email
      UNION
      SELECT email FROM trabajadores WHERE email = @email
    `);
  return result.recordset[0] || null;
}

// ACTUALIZAR CONTRASEÑA
async function updatePassword(email, contrasena) {
  const pool = await poolPromise;
  const hashed = await bcrypt.hash(contrasena, 10);
  await pool.request()
    .input('email', sql.VarChar, email)
    .input('password', sql.VarChar, hashed)
    .query(`
      DECLARE @id INT;
      SET @id = (SELECT id_cliente FROM clientes WHERE email = @email);
      IF @id IS NOT NULL
      BEGIN
          UPDATE usuarios SET CONTRASENA = @password WHERE id_cliente = @id;
      END
      ELSE
      BEGIN
          SET @id = (SELECT id_trabajador FROM trabajadores WHERE email = @email);
          IF @id IS NOT NULL
          BEGIN
              UPDATE usuarios SET CONTRASENA = @password WHERE id_trabajador = @id;
          END
      END
    `);
}

// =============================================
// FUNCIONES EXCLUSIVAS PARA GOOGLE AUTH
// =============================================

// LOGIN GOOGLE: Busca al usuario por su email
async function loginOauthGoogle(email) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('email', sql.VarChar(100), email.trim())
    .query(`
      SELECT U.ID_USUARIO, U.USUARIO, U.TIPO_USUARIO, U.ID_CLIENTE, U.ID_TRABAJADOR
      FROM Usuarios U
      INNER JOIN Clientes C ON U.ID_CLIENTE = C.ID_CLIENTE
      WHERE C.EMAIL = @email
    `);

  if (result.recordset.length === 0) return null;
  return result.recordset[0];
}

// REGISTRO GOOGLE: Inserta un cliente sin DNI
async function registrarClienteOauthGoogle(clienteGoogle) {
  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();
    const request = new sql.Request(transaction);

    // DNI y TELEFONO en NULL
    const clienteResult = await request
      .input('nombres', sql.VarChar(100), clienteGoogle.nombres)
      .input('apellidos', sql.VarChar(100), clienteGoogle.apellidos)
      .input('email', sql.VarChar(100), clienteGoogle.email)
      .query(`
        INSERT INTO Clientes (NOMBRES, APELLIDOS, DNI, TELEFONO, EMAIL)
        OUTPUT INSERTED.ID_CLIENTE
        VALUES (@nombres, @apellidos, NULL, NULL, @email)
      `);

    const idCliente = clienteResult.recordset[0].ID_CLIENTE;

    // CONTRASENA en NULL y GOOGLE_ID guardado
    await request
      .input('usuario', sql.VarChar(100), clienteGoogle.usuario)
      .input('google_id', sql.VarChar(255), clienteGoogle.google_id)
      .input('id_cliente', sql.Int, idCliente)
      .query(`
        INSERT INTO Usuarios (USUARIO, CONTRASENA, GOOGLE_ID, ID_CLIENTE)
        VALUES (@usuario, NULL, @google_id, @id_cliente)
      `);

    await transaction.commit();
    return { idCliente };

  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

module.exports = {
  registrarClienteYUsuario,
  loginUsuario,
  findUserByEmail,
  updatePassword,
  loginOauthGoogle,
  registrarClienteOauthGoogle
};

