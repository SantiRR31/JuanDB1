const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'web')));
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true
}));
app.set('view engine', 'ejs');

let connection;

async function initializeDatabase() {
    connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'root'
    });

    await connection.query(`CREATE DATABASE IF NOT EXISTS user_management`);
    await connection.changeUser({ database: 'user_management' });

    await connection.query(`
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            role ENUM('admin', 'user') DEFAULT 'user'
        )
    `);

    // Verificar si existe algún usuario administrador
    const [rows] = await connection.query('SELECT * FROM users WHERE role = "admin"');
    if (rows.length === 0) {
        // Crear un administrador predeterminado si no existe
        const hashedPassword = await bcrypt.hash('Password1_', 10);
        await connection.query('INSERT INTO users (email, password, role) VALUES (?, ?, ?)', ['admin@example.com', hashedPassword, 'admin']);
        console.log('Administrador predeterminado creado con correo: admin@example.com y contraseña: Password1_');
    }
}

initializeDatabase().catch(err => {
    console.error('Unable to connect to the database:', err);
});

function checkAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    }
    res.redirect('/auth');
}

function checkAdmin(req, res, next) {
    if (req.session.user && req.session.user.role === 'admin') {
        return next();
    }
    res.status(403).send('Access denied');
}

app.get('/auth', (req, res) => {
    res.render('auth');
});

// Ruta para registrar usuarios
app.post('/register', async (req, res) => {
    const { nombre, correo, contra } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(contra, 10);
        // Aquí debes usar solo las columnas que existen en tu tabla
        await connection.query('INSERT INTO users (email, password) VALUES (?, ?)', [correo, hashedPassword]);
        
        res.redirect('/index');
    } catch (error) {
        console.error('Error al registrar usuario:', error);
        res.status(500).send('Error del servidor');
    }
});

// Ruta para iniciar sesión
app.post('/login', async (req, res) => {
    const { correo, password } = req.body;

    try {
        const [rows] = await connection.query('SELECT * FROM users WHERE email = ?', [correo]);
        if (rows.length > 0) {
            const user = rows[0];
            const match = await bcrypt.compare(password, user.password);

            if (match) {
                // Login exitoso
                req.session.user = user;  // Guardar el usuario en la sesión
                res.redirect('/index');
            } else {
                // Contraseña incorrecta
                res.status(401).send('Email or password incorrect');
            }
        } else {
            // Correo no encontrado
            res.status(401).send('Email or password incorrect');
        }
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        res.status(500).send('Error del servidor');
    }
});

app.get('/index', checkAuthenticated, async (req, res) => {
    try {
        const [databases] = await connection.query('SHOW DATABASES');
        const databaseNames = databases.map(db => db.Database);
        res.render('index', { databases: databaseNames, user: req.session.user });
    } catch (err) {
        res.status(500).send('Error fetching databases: ' + err.message);
    }
});

app.get('/', (req, res) => {
    res.redirect('/home');
});

app.get('/manage-users', checkAdmin, async (req, res) => {
    const [users] = await connection.query('SELECT id, email, role FROM users WHERE role != "admin"');
    res.render('manage-users', { users });
});

app.post('/update-role', checkAdmin, async (req, res) => {
    const { userId, role } = req.body;
    await connection.query('UPDATE users SET role = ? WHERE id = ?', [role, userId]);
    res.redirect('/manage-users');
});

app.get('/home', (req, res) => {
    res.render('home');
});

// Ruta para crear base de datos
app.post('/create-database', async (req, res) => {
    try {
        const { databaseName } = req.body;
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${mysql.escapeId(databaseName)}`);

        return res.send(`
            <script>
                alert("La base de datos se creó con éxito");
                window.location.href = "/index";
            </script>
        `);
    } catch (err) {
        return res.status(500).send('Error creating database: ' + err.message);
    }
});

// Ruta para crear tabla
app.post('/create-table', async (req, res) => {
    try {
        const { databaseName, tableName, fieldNames, fieldTypes, fieldSizes, hasPrimaryKey, primaryKeyName, primaryKeyType, primaryKeySize } = req.body;
        await connection.changeUser({ database: databaseName });

        // Construir los campos de la tabla
        const fields = [];
        for (let i = 0; i < fieldNames.length; i++) {
            let field = `\`${fieldNames[i]}\` ${fieldTypes[i]}`;
            if (fieldTypes[i].toUpperCase() === 'VARCHAR') {
                field += `(${fieldSizes[i]})`;
            }
            fields.push(field);
        }

        // Añadir la clave primaria si se ha especificado
        let primaryKey = '';
        if (hasPrimaryKey === 'on') {
            primaryKey = `, \`${primaryKeyName}\` ${primaryKeyType}`;
            if (primaryKeyType.toUpperCase() === 'VARCHAR') {
                primaryKey += `(${primaryKeySize})`;
            }
            primaryKey += ' PRIMARY KEY';
        }

        // Construir la consulta SQL
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS \`${tableName}\` (
                ${fields.join(', ')}
                ${primaryKey}
            )
        `;

        // Asegúrate de que no haya errores de sintaxis en la consulta
        console.log(createTableQuery);

        await connection.query(createTableQuery);

        return res.send(`
            <script>
                alert("La tabla se creó con éxito");
                window.location.href = "/index";
            </script>
        `);
    } catch (err) {
        return res.status(500).send('Error creating table: ' + err.message);
    }
});
// Ruta para insertar datos
app.post('/insert-data', async (req, res) => {
    try {
        const { databaseName, tableName, ...data } = req.body;
        await connection.changeUser({ database: databaseName });
        const fields = Object.keys(data);
        const values = Object.values(data);
        await connection.query(`INSERT INTO ?? (??) VALUES (?)`, [tableName, fields, values]);

        return res.send(`
            <script>
                alert("Los datos se insertaron con éxito");
                window.location.href = "/index";
            </script>
        `);
    } catch (err) {
        return res.status(500).send('Error inserting data: ' + err.message);
    }
});

// Ruta para actualizar datos
app.post('/update-data', async (req, res) => {
    try {
        const { databaseName, tableName, primaryKeyValue, primaryKeyField, ...data } = req.body;

        if (!primaryKeyValue || !primaryKeyField) {
            throw new Error('Falta el valor de la clave primaria o el campo de clave primaria.');
        }

        await connection.changeUser({ database: databaseName });

        // Construye las partes SET de la consulta asegurando el escape de nombres de campo y valores
        const fields = Object.keys(data).map(field => `${mysql.escapeId(field)} = ?`).join(', ');
        const values = Object.values(data).concat(primaryKeyValue);

        // Construye y ejecuta la consulta de actualización
        const updateQuery = `UPDATE ?? SET ${fields} WHERE ${mysql.escapeId(primaryKeyField)} = ?`;
        await connection.query(updateQuery, [tableName, ...values]);

        res.redirect('/');
    } catch (err) {
        res.status(500).send('Error updating data: ' + err.message);
    }
});

// Ruta para eliminar datos
app.post('/delete-data', async (req, res) => {
    try {
        const { databaseName, tableName, primaryKeyName, primaryKeyValue } = req.body;
        await connection.changeUser({ database: databaseName });

        const deleteQuery = `DELETE FROM \`${tableName}\` WHERE \`${primaryKeyName}\` = ?`;
        await connection.query(deleteQuery, [primaryKeyValue]);

        return res.send(`
            <script>
                alert("Los datos se eliminaron con éxito");
                window.location.href = "/index";
            </script>
        `);
    } catch (err) {
        return res.status(500).send('Error deleting data: ' + err.message);
    }
});
// Ruta para eliminar una tabla
app.post('/drop-table', async (req, res) => {
    try {
        const { databaseName, tableName } = req.body;
        await connection.changeUser({ database: databaseName });
        await connection.query(`DROP TABLE IF EXISTS ??`, [tableName]);

        return res.send(`
            <script>
                alert("La tabla se eliminó con éxito");
                window.location.href = "/index";
            </script>
        `);
    } catch (err) {
        return res.status(500).send('Error dropping table: ' + err.message);
    }
});

app.get('/get-tables', async (req, res) => {
    try {
        const { database } = req.query;
        await connection.changeUser({ database });
        const [tables] = await connection.query('SHOW TABLES');
        const tableNames = tables.map(row => Object.values(row)[0]);
        res.json(tableNames);
    } catch (err) {
        res.status(500).send('Error fetching tables: ' + err.message);
    }
});

app.get('/get-fields', async (req, res) => {
    try {
        const { database, table } = req.query;
        await connection.changeUser({ database });
        const [fields] = await connection.query(`DESCRIBE ??`, [table]);
        const fieldNames = fields.map(field => field.Field);
        res.json(fieldNames);
    } catch (err) {
        res.status(500).send('Error fetching fields: ' + err.message);
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});