const empleadoModel = require('../models/empleadosModel');

exports.crearEmpleado = async (req, res) => {
  console.log("🔥 Se llamó crearEmpleado");
  try {
    const { nombres, apellidos, dni, telefono, email, usuario, contrasena, idCargo, idHorario } = req.body;

    //Validar cargo
    const cargo = await empleadoModel.obtenerCargoPorId(idCargo);
    if (!cargo) {
      return res.status(400).json({ mensaje: 'El cargo seleccionado no existe.' });
    }

    //Asignar tipoUsuario según el cargo
    let tipoUsuario;
    console.log("DEBUG idCargo recibido:", idCargo);
    console.log("DEBUG cargo encontrado:", cargo);
    switch (cargo.DESCRIPCION.trim().toLowerCase()) {
      case 'admin':
        tipoUsuario = 'admin';
        break;
      case 'cajero':
        tipoUsuario = 'cajero';
        break;
      case 'cocinero':
        tipoUsuario = 'cocinero';
        break;
      case 'mozo':
        tipoUsuario = 'mozo';
        break;
      default:
        tipoUsuario = 'empleado';
    }


    // registro de usuario y empleado
    const result = await empleadoModel.registrarEmpleadoYUsuario(
      { nombres, apellidos, dni, telefono, email, idCargo, idHorario },
      { usuario, contrasena, tipoUsuario }
    );

    res.json({ mensaje: 'Empleado registrado correctamente', idTrabajador: result.idTrabajador });

  } catch (error) {
    console.error('Error al crear empleado:', error);
    res.status(500).json({ mensaje: 'Ocurrió un error al registrar el empleado.' });
  }
};


exports.listarEmpleados = async (req, res) => {
  try {
    const empleados = await empleadoModel.obtenerEmpleadosAdmin();
    res.json(empleados);
  } catch (error) {
    console.error('Error al listar empleados:', error);
    res.status(500).json({ mensaje: 'Error al obtener empleados' });
  }
};

exports.listarCargos = async (req, res) => {
  try {
    const cargos = await empleadoModel.obtenerCargosAdmin();
    res.json(cargos);
  } catch (error) {
    console.error('Error al listar cargos:', error);
    res.status(500).json({ mensaje: 'Error al obtener cargos' });
  }
};

exports.listarHorarios = async (req, res) => {
  try {
    const horarios = await empleadoModel.obtenerHorariosAdmin();
    res.json(horarios);
  } catch (error) {
    console.error('Error al listar horarios:', error);
    res.status(500).json({ mensaje: 'Error al obtener horarios' });
  }
};

// Eliminar empleado
exports.eliminarEmpleado = async (req, res) => {
  try {
    const { id } = req.params;

    await empleadoModel.eliminarEmpleado(id);
    res.json({ mensaje: 'Empleado eliminado correctamente' });

  } catch (error) {
    console.error('Error al eliminar empleado:', error);
    res.status(500).json({ mensaje: 'Error al eliminar el empleado.' });
  }
};

// Actualizar empleado
exports.actualizarEmpleado = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombres, apellidos, dni, telefono, email, usuario, contrasena, idCargo, idHorario } = req.body;

    // Validar cargo y asignar tipoUsuario
    const cargo = await empleadoModel.obtenerCargoPorId(idCargo);
    if (!cargo) {
      return res.status(400).json({ mensaje: 'El cargo seleccionado no existe.' });
    }

    let tipoUsuario;
    switch (cargo.DESCRIPCION.toLowerCase()) {
      case 'admin':
        tipoUsuario = 'admin';
        break;
      case 'cajero':
        tipoUsuario = 'cajero';
        break;
      case 'cocinero':
        tipoUsuario = 'cocinero';
        break;
      case 'mozo':
        tipoUsuario = 'mozo';
        break;
      default:
        tipoUsuario = 'empleado';
    }

    await empleadoModel.actualizarEmpleado(
      id,
      { nombres, apellidos, dni, telefono, email, idCargo, idHorario },
      { usuario, contrasena, tipoUsuario }
    );

    res.json({ mensaje: 'Empleado actualizado correctamente' });

  } catch (error) {
    console.error('Error al actualizar empleado:', error);
    res.status(500).json({ mensaje: 'Error al actualizar el empleado.' });
  }
};

exports.obtenerEmpleadoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const empleado = await empleadoModel.obtenerEmpleadoPorId(id);
    if (!empleado) return res.status(404).json({ mensaje: 'Empleado no encontrado' });
    res.json(empleado);
  } catch (error) {
    console.error('Error al obtener empleado:', error);
    res.status(500).json({ mensaje: 'Error al obtener empleado' });
  }
};

exports.registrarHorario = async (req, res) => {
  try {
    const { hora_inicio, hora_fin } = req.body;
    // 🔹 Validación básica
    if (!hora_inicio || !hora_fin) {
      return res.status(400).json({
        mensaje: "Datos incompletos"
      });
    }
    // 🔹 Validación lógica
    if (hora_inicio >= hora_fin) {
      return res.status(400).json({
        mensaje: "La hora de inicio debe ser menor que la hora fin"
      });
    }
    await empleadoModel.crearHorario(hora_inicio, hora_fin);
    res.json({
      mensaje: "Horario registrado correctamente"
    });

  } catch (error) {
    console.error("Error al registrar horario:", error);
    res.status(500).json({
      mensaje: "Error al registrar horario"
    });
  }
};

//Controlador para listarHorarios
/*exports.listarHorarios = async (req, res) => {
  try {
    const horarios = await empleadoModel.listarHorarios();

    res.json(horarios);

  } catch (error) {
    console.error("Error al listar horarios:", error);
    res.status(500).json({
      mensaje: "Error al listar horarios"
    });
  }
};
*/
//Controlador para actualizarHorario
exports.actualizarHorario = async (req, res) => {
  try {
    const { id } = req.params;
    const { hora_inicio, hora_fin } = req.body;
    if (!hora_inicio || !hora_fin) {
      return res.status(400).json({
        mensaje: "Datos incompletos"
      });
    }
    if (hora_inicio >= hora_fin) {
      return res.status(400).json({
        mensaje: "La hora de inicio debe ser menor que la hora fin"
      });
    }
    const actualizado = await empleadoModel.actualizarHorario(
      id,
      hora_inicio,
      hora_fin
    );
    if (!actualizado) {
      return res.status(404).json({
        mensaje: "Horario no encontrado"
      });
    }
    res.json({
      mensaje: "Horario actualizado correctamente"
    });
  } catch (error) {
    console.error("Error al actualizar horario:", error);
    res.status(500).json({
      mensaje: "Error al actualizar horario"
    });
  }
};

//Controlador para eliminarHorario
exports.eliminarHorario = async (req, res) => {
  try {
    const { id } = req.params;
    const eliminado = await empleadoModel.eliminarHorario(id);
    if (!eliminado) {
      return res.status(404).json({
        mensaje: "Horario no encontrado"
      });
    }
    res.json({
      mensaje: "Horario eliminado correctamente"
    });
  } catch (error) {
    console.error("Error al eliminar horario:", error);
    res.status(500).json({
      mensaje: "Error al eliminar horario"
    });
  }
};
