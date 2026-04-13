// middlewares/multerCategoria.js
// Usamos memoryStorage: multer almacena el archivo en RAM (req.file.buffer)
// El controlador se encarga de moverlo al disco con la carpeta correcta.
const multer = require('multer');

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB máximo
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif/;
    const ext = file.originalname.split('.').pop().toLowerCase();
    if (allowed.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes (jpg, png, webp, gif)'));
    }
  }
});

module.exports = upload;