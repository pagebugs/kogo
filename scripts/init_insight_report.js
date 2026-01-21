/**
 * InsightReport 테이블 생성 스크립트
 * 
 * Simulation 데이터 기반 분석 리포트
 * - Simulation은 불변 로그
 * - InsightReport는 사용자 소유 가공물
 */

const mysql = require('mysql2/promise');

async function initInsightReport() {
    console.log('=== Initializing InsightReport Table ===');

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

        // InsightReport 테이블 생성
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS insight_report (
                id INT AUTO_INCREMENT PRIMARY KEY,
                report_id VARCHAR(64) NOT NULL UNIQUE COMMENT '리포트 고유 ID (RPT-xxxxx)',
                user_id INT NOT NULL COMMENT 'User ID (FK) - 리포트 소유자',
                sim_id INT NOT NULL COMMENT 'Simulation ID (FK) - 원본 시뮬레이션',
                title VARCHAR(255) DEFAULT NULL COMMENT '리포트 제목 (사용자 지정)',
                snapshot JSON NOT NULL COMMENT '계산 결과 요약 스냅샷',
                generated_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '생성 시각',
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                INDEX idx_report_id (report_id),
                INDEX idx_user_id (user_id),
                INDEX idx_sim_id (sim_id),
                INDEX idx_generated_at (generated_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            COMMENT='Insight Report - 시뮬레이션 기반 분석 리포트 (사용자 소유)';
        `;
        
        await connection.execute(createTableQuery);
        console.log('✅ Table "insight_report" created or already exists.');
        
        // 스키마 확인
        const [rows] = await connection.execute('DESCRIBE insight_report');
        console.table(rows);

        console.log('\n=== Initialization Complete ===');

    } catch (err) {
        console.error('Initialization Error:', err);
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
}

initInsightReport();
