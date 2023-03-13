require("dotenv").config();
module.exports = {
    JWT_SECRET: process.env.JWT_SECRET,
    DB_PASS: process.env.DB_PASS,
    DB_USER: process.env.DB_USER,
    DB_HOST: process.env.DB_HOST,
    INSTANCE_UNIX_SOCKET: process.env.INSTANCE_UNIX_SOCKET,
    DB_NAME: process.env.DB_NAME,
    SENDINGBLUE_API_KEY: process.env.SENDINGBLUE_API_KEY
};