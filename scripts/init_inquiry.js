const mysql = require('mysql2/promise');
const crypto = require('crypto');

/**
 * Inquiry (비밀 문의) 테이블 생성 스크립트
 * 
 * 요구사항 (todo/id.md 기반):
 * - 비로그인 가능
 * - 비밀 게시판 (password_hash)
 * - Simulation과 연결 가능 (optional)
 */
async function initInquiry() {
    console.log('=== Initializing Inquiry Table ===');

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

        // Inquiry 테이블 생성
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS inquiry (
                id INT AUTO_INCREMENT PRIMARY KEY,
                inquiry_id VARCHAR(64) NOT NULL UNIQUE COMMENT '문의 고유 ID (INQ-xxxxx)',
                session_id VARCHAR(64) NOT NULL COMMENT 'Session 참조 (FK)',
                sim_uuid VARCHAR(50) DEFAULT NULL COMMENT '관련 Simulation UUID (optional)',
                
                -- 문의 내용
                title VARCHAR(255) NOT NULL COMMENT '문의 제목',
                content TEXT NOT NULL COMMENT '문의 내용',
                contact_info VARCHAR(255) DEFAULT NULL COMMENT '연락처 (email/phone)',
                
                -- 비밀 게시판 기능
                password_hash VARCHAR(255) NOT NULL COMMENT '비밀번호 해시 (bcrypt 또는 sha256)',
                
                -- 상태
                status ENUM('pending', 'in_progress', 'resolved', 'closed') DEFAULT 'pending' COMMENT '문의 상태',
                
                -- 관리자 응답
                admin_reply TEXT DEFAULT NULL COMMENT '관리자 답변',
                replied_at DATETIME DEFAULT NULL COMMENT '답변 시각',
                
                -- 타임스탬프
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                -- 인덱스
                INDEX idx_inquiry_id (inquiry_id),
                INDEX idx_session_id (session_id),
                INDEX idx_sim_uuid (sim_uuid),
                INDEX idx_status (status),
                INDEX idx_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            COMMENT='비밀 문의 게시판 (비로그인 가능)';
        `;
        
        await connection.execute(createTableQuery);
        console.log('✅ Table "inquiry" created or already exists.');
        
        // 스키마 확인
        const [rows] = await connection.execute('DESCRIBE inquiry');
        console.table(rows);

        console.log('\n=== Initialization Complete ===');

    } catch (err) {
        console.error('Initialization Error:', err);
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
}

initInquiry();
