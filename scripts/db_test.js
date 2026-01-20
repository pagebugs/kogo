const mysql = require('mysql2/promise');

async function testDB() {
    console.log('Starting DB Test...');
    
    // Connect to MariaDB with provided credentials
    const config = {
        host: 'localhost',
        user: 'kogha0000',
        password: 'web@#$0133',
        database: 'kogha0000',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    };

    let connection;
    try {
        console.log('Connecting to MariaDB...');
        connection = await mysql.createConnection(config);
        console.log('Connected via TCP!');
    } catch (err) {
        console.log('TCP connection failed, trying socket...', err.message);
        try {
             connection = await mysql.createConnection({
                ...config,
                socketPath: '/run/mysqld/mysqld.sock'
            });
            console.log('Connected via Socket!');
        } catch (socketErr) {
            console.error('Socket connection also failed:', socketErr.message);
            process.exit(1);
        }
    }

    try {
        console.log('Database "kogha0000" connected.');

        // Create Table if not exists
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS temp_ad_leads (
                id INT AUTO_INCREMENT PRIMARY KEY,
                customer_name VARCHAR(255),
                contact VARCHAR(255),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `;
        await connection.execute(createTableQuery);
        console.log('Table "temp_ad_leads" is ready.');

        // Insert Data
        const insertQuery = 'INSERT INTO temp_ad_leads (customer_name, contact) VALUES (?, ?)';
        const [insertResult] = await connection.execute(insertQuery, ['Test User', '010-1234-5678']);
        console.log('Inserted Data ID:', insertResult.insertId);

        // Select Data
        const [rows] = await connection.execute('SELECT * FROM temp_ad_leads');
        console.log('Current Data in DB:');
        console.table(rows);

    } catch (err) {
        console.error('Query Error:', err);
    } finally {
        if (connection) await connection.end();
        console.log('Test Finished.');
    }
}

testDB();
