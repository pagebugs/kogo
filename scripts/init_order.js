/**
 * Order 테이블 생성 스크립트
 * 
 * Runcomm과 정합될 유일한 상업 단위
 * - Insight Report 기반 광고 주문
 * - 상태 관리: ORDERED → RUNNING → DONE
 */

const mysql = require('mysql2/promise');

async function initOrder() {
    console.log('=== Initializing Order Table ===');

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

        // Order 테이블 생성
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS \`order\` (
                id INT AUTO_INCREMENT PRIMARY KEY,
                order_id VARCHAR(64) NOT NULL UNIQUE COMMENT '주문 고유 ID (ORD-xxxxx)',
                user_id INT NOT NULL COMMENT 'User ID (FK) - 주문자',
                report_id INT DEFAULT NULL COMMENT 'InsightReport ID (FK, optional)',
                sim_snapshot JSON DEFAULT NULL COMMENT 'Simulation 스냅샷 (report 없을 경우)',
                
                -- 주문 정보
                amount DECIMAL(12, 0) NOT NULL COMMENT '주문 금액 (원)',
                status ENUM('ORDERED', 'RUNNING', 'DONE', 'CANCELLED') DEFAULT 'ORDERED' 
                    COMMENT '주문 상태',
                
                -- Runcomm 연동
                runcomm_ref VARCHAR(100) DEFAULT NULL COMMENT 'Runcomm 전달 참조값',
                runcomm_sent_at DATETIME DEFAULT NULL COMMENT 'Runcomm 전달 시각',
                
                -- 메모
                note TEXT DEFAULT NULL COMMENT '관리자 메모',
                
                -- 타임스탬프
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                INDEX idx_order_id (order_id),
                INDEX idx_user_id (user_id),
                INDEX idx_status (status),
                INDEX idx_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            COMMENT='광고 주문 - Runcomm 연동 상업 단위';
        `;
        
        await connection.execute(createTableQuery);
        console.log('✅ Table "order" created or already exists.');
        
        // 스키마 확인
        const [rows] = await connection.execute('DESCRIBE `order`');
        console.table(rows);

        console.log('\n=== Initialization Complete ===');

    } catch (err) {
        console.error('Initialization Error:', err);
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
}

initOrder();
