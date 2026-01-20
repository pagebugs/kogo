const mysql = require('mysql2/promise');

async function initSession() {
    console.log('Initializing Session Table...');

    const config = {
        host: 'localhost',
        user: 'touchad_dev',
        password: 'devpass',
        database: 'kogha0000',
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

        // Create Session Table
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS session (
                id INT AUTO_INCREMENT PRIMARY KEY,
                session_id VARCHAR(64) NOT NULL UNIQUE COMMENT '클라이언트 생성 세션 ID (sess_xxx)',
                user_id INT DEFAULT NULL COMMENT '로그인 시 연결될 User ID (FK, nullable)',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                expires_at DATETIME DEFAULT NULL COMMENT '세션 만료 시간 (nullable = 무기한)',
                last_active_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                user_agent TEXT COMMENT '브라우저 정보',
                ip_address VARCHAR(45) COMMENT 'IPv4/IPv6 지원',
                metadata JSON DEFAULT NULL COMMENT '추가 컨텍스트 정보',
                INDEX idx_session_id (session_id),
                INDEX idx_user_id (user_id),
                INDEX idx_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;
        
        await connection.execute(createTableQuery);
        console.log('Table "session" created or already exists.');
        
        // Describe Table
        const [rows] = await connection.execute('DESCRIBE session');
        console.table(rows);

    } catch (err) {
        console.error('Initialization Error:', err);
        process.exit(1);
    } finally {
        if (connection) await connection.end();
        console.log('Initialization Finished.');
    }
}

initSession();
