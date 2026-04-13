//Importamos las funciones de  usuarioModel
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const usuarioModel = require('../models/usuarioModel');
const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

//
/*const usuarioModel = require('../services/usuarioModel');*/
const { saveCode, verifyCod, isVerified, clearData } = require('../models/resetPassword');
const nodemailer = require('nodemailer');


async function registrar(req, res) {
  try {
    const { nombres, apellidos, dni, telefono, email, usuario, contrasena } = req.body;

    const cliente = { nombres, apellidos, dni, telefono, email };
    const user = { usuario, contrasena };

    const resultado = await usuarioModel.registrarClienteYUsuario(cliente, user);
    res.status(201).json({ mensaje: 'Cliente y usuario registrado con éxito', idCliente: resultado.idCliente });
  } catch (error) {
    console.error('Error en el registro:', error);
    res.status(500).json({ error: 'Error al registrar' });
  }
}

/*async function login(req, res) {
  try {
    const { usuario, contrasena } = req.body;
    const user = await loginUsuario(usuario, contrasena);

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    res.status(200).json({ mensaje: 'Inicio de sesión exitoso', user });
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
}*/

async function login(req, res) {
  try {
    const { usuario, contrasena } = req.body;

    const user = await usuarioModel.loginUsuario(usuario, contrasena);

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    //Creacion de TOKEN jwt (usuario, tipo_usuario, id_usuario)
    const token = jwt.sign(
      {
        id: user.ID_USUARIO,
        rol: user.TIPO_USUARIO,
        usuario: user.USUARIO,
        cliente: user.ID_CLIENTE,
        trabajador: user.ID_TRABAJADOR
      },
      config.jwtSecret,
      { expiresIn: config.jwtExpires }
    );

    //Respuesta para postman
    res.status(200).json({
      mensaje: 'Inicio de sesión exitoso',
      token,
      usuario: {
        id: user.ID_USUARIO,
        usuario: user.USUARIO,
        rol: user.TIPO_USUARIO,
        cliente: user.ID_CLIENTE,
        trabajador: user.ID_TRABAJADOR
      }
    });

  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
}

//GENERAR CÓDIGOS DE 6 DÍGITOS
const generateCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

//Enviar correo con código
const sendEmail = async (email, code) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "sergiomarceloatencio@gmail.com",
      pass: "xmdlesxhhunmakxr"
    }
  });

  await transporter.sendMail({
    to: email,
    subject: "Código de recuperación",
    html: `<h2>Tu código es: ${code}</h2>`
  });
};

// 1. enviar código
async function sendCode(req, res) {
  try {
    const { email } = req.body;
    const user = await usuarioModel.findUserByEmail(email);
    if (!user) {
      return res.status(400).json({ message: "Correo no registrado" });
    }
    const code = generateCode();
    saveCode(email, code);
    await sendEmail(email, code);
    res.json({ message: "Código enviado" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 2. verificar código
async function verifyCode(req, res) {
  const { email, code } = req.body;

  const valid = verifyCod(email, code);

  if (!valid) {
    return res.status(400).json({ message: "Código inválido" });
  }

  res.json({ message: "Código correcto" });
};

// 3. cambiar contraseña
async function resetPassword(req, res) {
  try {
    const { email, contrasena } = req.body;
    if (!isVerified(email)) {
      return res.status(403).json({ message: "No autorizado" });
    }
    await usuarioModel.updatePassword(email, contrasena);
    clearData(email);
    res.json({ message: "Contraseña actualizada" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
async function googleLogin(req, res) {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ error: 'Falta el token de Google.' });
    }

    // 1. Validar el token y pedirle los datos a Google
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: google_id, email, given_name: nombres, family_name: apellidos } = payload;

    // 2. Buscar si ya lo tenemos registrado
    let user = await usuarioModel.loginOauthGoogle(email);

    // 3. Si NO existe, crearlo (usará DNI nulo)
    if (!user) {

      // 1. Obtener la parte antes del @
    let nombreBase = email.split('@')[0];

    // 2. Limpiar caracteres especiales (dejar solo letras y números)
    nombreBase = nombreBase.replace(/[^a-zA-Z0-9]/g, '');

    // 3. Cortar a un máximo de 7 caracteres para dejar espacio a los números
    // Esto asegura que el total no pase de 10
    let corto = nombreBase.substring(0, 7);

    // 4. Agregar 3 números aleatorios (para evitar que el usuario ya exista)
    const random = Math.floor(100 + Math.random() * 900); 
    const usernameFinal = corto + random;

      await usuarioModel.registrarClienteOauthGoogle({ nombres, apellidos, email, google_id, usuario: usernameFinal });
      user = await usuarioModel.loginOauthGoogle(email);
    }

    // 4. Firmar nuestro propio JWT de NaciónBurger
    const token = jwt.sign(
      {
        id: user.ID_USUARIO,
        rol: user.TIPO_USUARIO,
        usuario: user.USUARIO,
        cliente: user.ID_CLIENTE,
        trabajador: user.ID_TRABAJADOR
      },
      config.jwtSecret,
      { expiresIn: config.jwtExpires }
    );

    // Devolver token al Frontend
    res.status(200).json({
      mensaje: 'Autenticación con Google exitosa',
      token,
      usuario: {
        id: user.ID_USUARIO,
        usuario: user.USUARIO,
        rol: user.TIPO_USUARIO,
        cliente: user.ID_CLIENTE,
        trabajador: user.ID_TRABAJADOR
      }
    });

  } catch (error) {
    console.error('Error Google Auth:', error);
    res.status(500).json({ error: 'Fallo al autenticar con Google.' });
  }
}


module.exports = {
  registrar,
  login,
  sendCode,
  verifyCode,
  resetPassword,
  googleLogin
};
