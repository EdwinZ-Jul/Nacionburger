require('dotenv').config();

module.exports = {
    port: process.env.PORT,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpires: process.env.JWT_EXPIRES_IN
};