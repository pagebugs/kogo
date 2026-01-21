/**
 * User 테이블 생성 스크립트
 * 
 * 사용자 계정 시스템의 기반 테이블
 */

const mysql = require('mysql2/promise');

async function initUser() {
    console.log('=== Initializing User Table ===');

    const config = {
        host: 'localhost',
        user: 'touchad_dev',
        password: 'devpass',
        database: 'kogha0000'
    };

    let connection;
    try {
        connection = await mysql.createConnection(config);
        console.log('Connected to MariaDB');

        // User 테이블 생성
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS user (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) NOT NULL UNIQUE COMMENT '이메일 (로그인 ID)',
                password_hash VARCHAR(255) NOT NULL COMMENT '비밀번호 해시 (bcrypt)',
                name VARCHAR(100) DEFAULT NULL COMMENT '사용자 이름',
                phone VARCHAR(20) DEFAULT NULL COMMENT '연락처',
                company VARCHAR(200) DEFAULT NULL COMMENT '회사명',
                status ENUM('active', 'inactive', 'pending') DEFAULT 'pending' COMMENT '계정 상태',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                last_login_at DATETIME DEFAULT NULL COMMENT '마지막 로그인 시각',
                
                INDEX idx_email (email),
                INDEX idx_status (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            COMMENT='사용자 계정';
        `;
        
        await connection.execute(createTableQuery);
        console.log('✅ Table "user" created or already exists.');
        
        // 스키마 확인
        const [rows] = await connection.execute('DESCRIBE user');
        console.table(rows);

        console.log('\n=== Initialization Complete ===');

    } catch (err) {
        console.error('Initialization Error:', err);
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
}

initUser();
