/*const express = require('express');
const router = express.Router();
const c1 = require('../controllers/empleadosController');*/

//routes/empleadosRoutes.js
const express = require('express');
const router = express.Router();
const admin = require('../controllers/empleadosController');
const authenticateJWT = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/authorizeRoles');

//Listar empleados
router.get(
    '/listar-empleados',
    authenticateJWT,
    authorizeRoles('admin'),
    admin.listarEmpleados
);

//Listar cargos
router.get(
    '/cargos',
    authenticateJWT,
    authorizeRoles('admin'),
    admin.listarCargos
);

//Listar horarios
router.get(
    '/horarios',
    authenticateJWT,
    authorizeRoles('admin'),
    admin.listarHorarios
);

//Crear empleado
router.post('/crear-empleado',
     authenticateJWT,
     authorizeRoles('admin'),
     admin.crearEmpleado
);

//Eliminar empleado
router.delete('/:id',
     authenticateJWT,
     authorizeRoles('admin'),
     admin.eliminarEmpleado
);

//Actualizar empleado
router.put('/:id',
     authenticateJWT,
     authorizeRoles('admin'),
     admin.actualizarEmpleado
);

//Obtener empleado por ID
router.get(
    '/:id', 
    authenticateJWT,
    authorizeRoles('admin'),
    admin.obtenerEmpleadoPorId
);

router.post(
    '/crear-horario',
    authenticateJWT,
    authorizeRoles('admin'),
    admin.registrarHorario
);

router.put(
    '/actualizar-horario/:id',
    authenticateJWT,
    authorizeRoles('admin'),
    admin.actualizarHorario
);

router.delete(
    '/eliminar-horario/:id',
    authenticateJWT,
    authorizeRoles('admin'),
    admin.eliminarHorario
);

module.exports = router;
