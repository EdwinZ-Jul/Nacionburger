const { poolPromise, sql } = require('../db');
const bcrypt = require('bcrypt');

//Servicio para Registrar un empleado con su usuario vinculado en una sola transacción
async function registrarEmpleadoYUsuario(empleado, usuario) {

  const pool = await poolPromise; 
  const transaction = new sql.Transaction(pool);

  try {

    await transaction.begin();

    const request = new sql.Request(transaction);

    //Hashear contraseña
    const hash = await bcrypt.hash(usuario.contrasena.trim(), 10);

    //Insertar trabajador
    const empleadoResult = await request
      .input('nombres', sql.VarChar, empleado.nombres)
      .input('apellidos', sql.VarChar, empleado.apellidos)
      .input('dni', sql.VarChar, empleado.dni)
      .input('telefono', sql.VarChar, empleado.telefono)
      .input('email', sql.VarChar, empleado.email)
      .input('idCargo', sql.Int, empleado.idCargo)
      .input('idHorario', sql.Int, empleado.idHorario)
      .query(`
        INSERT INTO Trabajadores 
        (NOMBRES, APELLIDOS, DNI, TELEFONO, EMAIL, ID_CARGO, ID_HORARIO)
        OUTPUT INSERTED.ID_TRABAJADOR
        VALUES (@nombres, @apellidos, @dni, @telefono, @email, @idCargo, @idHorario)
      `);

    const idTrabajador = empleadoResult.recordset[0].ID_TRABAJADOR;

    // 3️⃣ Insertar usuario vinculado
    await request
      .input('usuario', sql.VarChar, usuario.usuario.trim())
      .input('contrasena', sql.VarChar, hash)
      .input('idTrabajador', sql.Int, idTrabajador)
      .input('tipoUsuario', sql.VarChar, usuario.tipoUsuario)
      .query(`
        INSERT INTO Usuarios 
        (USUARIO, CONTRASENA, ID_TRABAJADOR, TIPO_USUARIO)
        VALUES (@usuario, @contrasena, @idTrabajador, @tipoUsuario)
      `);

    await transaction.commit();

    return { idTrabajador };

  } catch (error) {

    await transaction.rollback();
    console.error("Error en registrarEmpleadoYUsuario:", error);
    throw error;
  }
}


async function obtenerEmpleadosAdmin() {
  try {

    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT 
        t.ID_TRABAJADOR,
        t.NOMBRES,
        t.APELLIDOS,
        t.DNI,
        t.TELEFONO,
        t.EMAIL,
        c.DESCRIPCION AS CARGO,
        h.HORA_INICIO,
        h.HORA_FIN
      FROM Trabajadores t
      INNER JOIN Cargos c ON t.ID_CARGO = c.ID_CARGO
      INNER JOIN Horarios h ON t.ID_HORARIO = h.ID_HORARIO
    `);

    return result.recordset;

  } catch (error) {
    console.error("Error en obtenerEmpleadosAdmin:", error);
    throw error;
  }
}

//OBTENER CARGOS
async function obtenerCargosAdmin() {
  try {

    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT ID_CARGO, DESCRIPCION 
      FROM Cargos
    `);

    return result.recordset;

  } catch (error) {
    console.error("Error en obtenerCargosAdmin:", error);
    throw error;
  }
}


//OBTENER HORARIOS
async function obtenerHorariosAdmin() {
  try {

    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT 
        ID_HORARIO, 
        HORA_INICIO, 
        HORA_FIN 
      FROM Horarios
      ORDER BY HORA_INICIO ASC
    `);

    return result.recordset;

  } catch (error) {
    console.error("Error en obtenerHorariosAdmin:", error);
    throw error;
  }
}


//OBTENER CARGO POR ID
async function obtenerCargoPorId(idCargo) {
  try {

    const pool = await poolPromise;

    const result = await pool.request()
      .input('idCargo', sql.Int, idCargo)
      .query(`
        SELECT * 
        FROM Cargos 
        WHERE ID_CARGO = @idCargo
      `);

    return result.recordset[0] || null;

  } catch (error) {
    console.error("Error en obtenerCargoPorId:", error);
    throw error;
  }
}

// ELIMINAR EMPLEADO Y SU USUARIO (TRANSACCIÓN)
async function eliminarEmpleado(idTrabajador) {
  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);
  try {
    await transaction.begin();
    const request = new sql.Request(transaction);
    request.input('idTrabajador', sql.Int, idTrabajador);
    
    //Eliminar usuario vinculado
    await request
      .query(`
        DELETE FROM Usuarios 
        WHERE ID_TRABAJADOR = @idTrabajador
      `);
      
    //Eliminar trabajador
    await request
      .query(`
        DELETE FROM Trabajadores 
        WHERE ID_TRABAJADOR = @idTrabajador
      `);

    await transaction.commit();

    return true;

  } catch (error) {

    await transaction.rollback();
    console.error("Error en eliminarEmpleado:", error);
    throw error;
  }
}

// ACTUALIZAR EMPLEADO Y USUARIO
async function actualizarEmpleado(idTrabajador, empleado, usuario) {

  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);

  try {

    await transaction.begin();
    const request = new sql.Request(transaction);

    // 1️⃣ Actualizar trabajador
    await request
      .input('idTrabajador', sql.Int, idTrabajador)
      .input('nombres', sql.VarChar, empleado.nombres)
      .input('apellidos', sql.VarChar, empleado.apellidos)
      .input('dni', sql.VarChar, empleado.dni)
      .input('telefono', sql.VarChar, empleado.telefono)
      .input('email', sql.VarChar, empleado.email)
      .input('idCargo', sql.Int, empleado.idCargo)
      .input('idHorario', sql.Int, empleado.idHorario)
      .query(`
        UPDATE Trabajadores
        SET NOMBRES = @nombres,
            APELLIDOS = @apellidos,
            DNI = @dni,
            TELEFONO = @telefono,
            EMAIL = @email,
            ID_CARGO = @idCargo,
            ID_HORARIO = @idHorario
        WHERE ID_TRABAJADOR = @idTrabajador
      `);

    // 2️⃣ Hashear contraseña SOLO si viene nueva
    let hash = usuario.contrasena;
    if (usuario.contrasena) {
      hash = await bcrypt.hash(usuario.contrasena.trim(), 10);
    }

    // 3️⃣ Actualizar usuario vinculado
    await request
      .input('usuario', sql.VarChar, usuario.usuario)
      .input('contrasena', sql.VarChar, hash)
      .input('tipoUsuario', sql.VarChar, usuario.tipoUsuario)
      .query(`
        UPDATE Usuarios
        SET USUARIO = @usuario,
            CONTRASENA = @contrasena,
            TIPO_USUARIO = @tipoUsuario
        WHERE ID_TRABAJADOR = @idTrabajador
      `);

    await transaction.commit();

    return true;

  } catch (error) {

    await transaction.rollback();
    console.error("Error en actualizarEmpleado:", error);
    throw error;
  }
}


//OBTENER EMPLEADO POR ID (con su usuario)
async function obtenerEmpleadoPorId(idTrabajador) {
  try {

    const pool = await poolPromise;

    const result = await pool.request()
      .input('idTrabajador', sql.Int, idTrabajador)
      .query(`
        SELECT 
          t.ID_TRABAJADOR,
          t.NOMBRES,
          t.APELLIDOS,
          t.DNI,
          t.TELEFONO,
          t.EMAIL,
          t.ID_CARGO,
          t.ID_HORARIO,
          u.USUARIO
        FROM Trabajadores t
        INNER JOIN Usuarios u 
          ON t.ID_TRABAJADOR = u.ID_TRABAJADOR
        WHERE t.ID_TRABAJADOR = @idTrabajador
      `);

    return result.recordset[0] || null;

  } catch (error) {
    console.error("Error en obtenerEmpleadoPorId:", error);
    throw error;
  }
}

async function crearHorario(hora_inicio, hora_fin) {
  try {
    const pool = await poolPromise;

    await pool.request()
      .input("hora_inicio", sql.VarChar, hora_inicio)
      .input("hora_fin", sql.VarChar, hora_fin)
      .query(`
        INSERT INTO Horarios (HORA_INICIO, HORA_FIN)
        VALUES (@hora_inicio, @hora_fin)
      `);

    return true;

  } catch (error) {
    console.error("Error en crearHorario:", error);
    throw error;
  }
}

async function listarHorarios() {
  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .query(`
        SELECT 
          ID_HORARIO,
          HORA_INICIO,
          HORA_FIN
        FROM Horarios
        ORDER BY HORA_INICIO
      `);

    return result.recordset;

  } catch (error) {
    console.error("Error en listarHorarios:", error);
    throw error;
  }
}


async function actualizarHorario(id, hora_inicio, hora_fin) {
  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input("id", sql.Int, id)
      .input("hora_inicio", sql.VarChar, hora_inicio)
      .input("hora_fin", sql.VarChar, hora_fin)
      .query(`
        UPDATE Horarios
        SET 
          HORA_INICIO = @hora_inicio,
          HORA_FIN = @hora_fin
        WHERE ID_HORARIO = @id
      `);

    if (result.rowsAffected[0] === 0) {
      return null; // no encontrado
    }

    return true;

  } catch (error) {
    console.error("Error en actualizarHorario:", error);
    throw error;
  }
}

async function eliminarHorario(id) {
  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input("id", sql.Int, id)
      .query(`
        DELETE FROM Horarios
        WHERE ID_HORARIO = @id
      `);

    if (result.rowsAffected[0] === 0) {
      return null; // no existe
    }

    return true;

  } catch (error) {
    console.error("Error en eliminarHorario:", error);
    throw error;
  }
}
module.exports = {
  registrarEmpleadoYUsuario,
  obtenerEmpleadosAdmin,
  obtenerCargosAdmin,
  obtenerCargoPorId,
  obtenerHorariosAdmin,
  actualizarEmpleado,
  eliminarEmpleado,
  obtenerEmpleadoPorId,
  crearHorario,
  listarHorarios,
  actualizarHorario,
  eliminarHorario
};
