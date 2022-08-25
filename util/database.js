const mysql = require('mysql2');

require('dotenv').config();

const pool = mysql.createPool({
	host: 'localhost',
	user: process.env.DB_user,
	database: 'societyboard',
	password: process.env.DB_password,
});

module.exports = pool.promise();
