const mysql = require('mysql2/promise');

let connection;

async function initializeDatabase() {
    connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'password'
    });

    await connection.query(`CREATE DATABASE IF NOT EXISTS user_management`);
    await connection.changeUser({ database: 'user_management' });

    await connection.query(`
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            role ENUM('admin', 'user') DEFAULT 'user'
        )
    `);

    // Verificar si existe algún usuario administrador
    const [rows] = await connection.query('SELECT * FROM users WHERE role = "admin"');
    if (rows.length === 0) {
        // Crear un administrador predeterminado si no existe
        const hashedPassword = await bcrypt.hash('admin_password', 10);
        await connection.query('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', ['admin', hashedPassword, 'admin']);
        console.log('Administrador predeterminado creado con usuario: admin y contraseña: admin_password');
    }
}

initializeDatabase().catch(err => {
    console.error('Unable to connect to the database:', err);
});