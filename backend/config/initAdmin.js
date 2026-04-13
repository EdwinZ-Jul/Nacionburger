const bcrypt = require('bcrypt');
const { poolPromise, sql } = require('../db');

async function initAdmin() {
    try {
        const pool = await poolPromise;

        // 1. Verificar si ya existe
        const result = await pool.request()
            .input('usuarioAdmin', sql.VarChar, 'admin')
            .query('SELECT * FROM Usuarios WHERE USUARIO = @usuarioAdmin');

        if (result.recordset.length > 0) {
            console.log('Usuario administrador (Principal) ya existe');
            return;
        }

        console.log('Creando usuario administrador...');

        // 2. Hash de la contraseña
        const hash = await bcrypt.hash('NacionAdmin', 10);

        // 3. Crear el registro del Trabajador
        const trabajador = await pool.request()
            .query(`
                INSERT INTO Trabajadores 
                (NOMBRES, APELLIDOS, DNI, TELEFONO, EMAIL, ID_CARGO, ID_HORARIO)
                OUTPUT INSERTED.ID_TRABAJADOR
                VALUES ('Administrador', 'Sistemas', '00000000', '999999999', 'sergiomarceloatencio@gmail.com', 1, 1)
            `);

        const idTrabajador = trabajador.recordset[0].ID_TRABAJADOR;

        // 4. Crear el Usuario vinculado al trabajador con parámetros seguros
        await pool.request()
            .input('user', sql.VarChar, 'admin')
            .input('pass', sql.VarChar, hash)
            .input('idTrab', sql.Int, idTrabajador)
            .input('tipo', sql.VarChar, 'admin')
            .query(`
                INSERT INTO Usuarios (USUARIO, CONTRASENA, ID_TRABAJADOR, TIPO_USUARIO)
                VALUES (@user, @pass, @idTrab, @tipo)
            `);

        console.log('Usuario administrador creado exitosamente.');

    } catch (error) {
        console.error('Error al inicializar el admin:', error);
    }
}

module.exports = initAdmin;