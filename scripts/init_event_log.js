const mysql = require('mysql2/promise');

async function initEventLog() {
    console.log('Initializing Event Log Table...');

    const config = {
        host: 'localhost',
        user: 'touchad_dev',
        password: 'devpass',
        database: 'kogha0000', // 실제 데이터가 쌓일 DB
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    };

    let connection;
    try {
        console.log('Connecting to MariaDB...');
        // Try TCP first
        try {
             connection = await mysql.createConnection(config);
             console.log('Connected via TCP');
        } catch (tcpErr) {
            console.log('TCP failed, trying socket...', tcpErr.message);
            connection = await mysql.createConnection({
                ...config,
                socketPath: '/run/mysqld/mysqld.sock'
            });
            console.log('Connected via Socket');
        }

        // Create Table
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS event_log (
                id INT AUTO_INCREMENT PRIMARY KEY,
                event_type VARCHAR(50) NOT NULL COMMENT '이벤트 유형 (예: demo_click)',
                payload TEXT COMMENT '이벤트 상세 정보 (JSON 형태 권장)',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
        `;
        
        await connection.execute(createTableQuery);
        console.log('Table "event_log" created or already exists.');
        
        // Describe Table
        const [rows] = await connection.execute('DESCRIBE event_log');
        console.table(rows);

    } catch (err) {
        console.error('Initialization Error:', err);
        process.exit(1);
    } finally {
        if (connection) await connection.end();
        console.log('Initialization Finished.');
    }
}

initEventLog();
