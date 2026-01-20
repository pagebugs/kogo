const mysql = require('mysql2/promise');

async function setupDB() {
    console.log('Starting DB Setup...');
    
    // Connect as root via Socket
    const config = {
        socketPath: '/run/mysqld/mysqld.sock',
        user: 'root',
        password: '', // Usually root has no password on socket authentication
        waitForConnections: true,
        connectionLimit: 1
    };

    let connection;
    try {
        console.log('Connecting to MariaDB as root (socket)...');
        connection = await mysql.createConnection(config);
        console.log('Connected!');

        // 1. Create Database
        await connection.query(`CREATE DATABASE IF NOT EXISTS kogha0000`);
        console.log('Database "kogha0000" created/checked.');

        // 2. Create User & Grant Privileges
        // Check if user exists to decide on CREATE or ALTER (simplified to GRANT identifying by)
        await connection.query(`GRANT ALL PRIVILEGES ON kogha0000.* TO 'kogha0000'@'localhost' IDENTIFIED BY 'web@#$0133' WITH GRANT OPTION`);
        await connection.query(`FLUSH PRIVILEGES`);
        console.log('User "kogha0000" configured.');

    } catch (err) {
        console.error('Setup Error:', err);
        process.exit(1);
    } finally {
        if (connection) await connection.end();
        console.log('Setup Finished.');
    }
}

setupDB();
