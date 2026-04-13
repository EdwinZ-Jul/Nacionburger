const express = require('express'); /*Importacion del modulo express para poder usarlo*/
const router = express.Router();
const a1 = require('../controllers/authController'); /*Traemos las funciones exportadas de auth controller*/


// "/auth" URL Base para las rutas de autenticación
 
router.post('/registro', a1.registrar); /*Cuando ejecute Peticion POST a la ruta /login se usa la funcion de registrar*/
router.post('/login', a1.login); /*//*/
router.post('/google', a1.googleLogin);


//
router.post('/send-code', a1.sendCode);
router.post('/verify-code', a1.verifyCode);
router.post('/reset-password', a1.resetPassword);

module.exports = router; /*Exportamos en enrutador para que pueda ser utilizado en otro archivo*/