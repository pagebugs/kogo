/**
 * SimulationAccess 테이블 생성 스크립트
 * 
 * 사용자가 접근 가능한 Simulation 기록
 * - 로그인 시 현재 세션의 Simulation에 접근 권한 부여
 * - 소유권이 아닌 "접근 권한"만 기록
 */

const mysql = require('mysql2/promise');

async function initSimulationAccess() {
    console.log('=== Initializing SimulationAccess Table ===');

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

        // SimulationAccess 테이블 생성
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS simulation_access (
                id INT AUTO_INCREMENT PRIMARY KEY,
                sim_id INT NOT NULL COMMENT 'Simulation ID (FK)',
                user_id INT NOT NULL COMMENT 'User ID (FK)',
                granted_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '권한 부여 시각',
                source ENUM('login', 'manual_save', 'share') DEFAULT 'login' 
                    COMMENT '권한 부여 경로: login=로그인 시 자동, manual_save=명시적 저장, share=공유받음',
                
                INDEX idx_sim_id (sim_id),
                INDEX idx_user_id (user_id),
                INDEX idx_granted_at (granted_at),
                UNIQUE KEY uk_sim_user (sim_id, user_id) COMMENT '중복 방지'
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            COMMENT='사용자-시뮬레이션 접근 권한 매핑';
        `;
        
        await connection.execute(createTableQuery);
        console.log('✅ Table "simulation_access" created or already exists.');
        
        // 스키마 확인
        const [rows] = await connection.execute('DESCRIBE simulation_access');
        console.table(rows);

        console.log('\n=== Initialization Complete ===');

    } catch (err) {
        console.error('Initialization Error:', err);
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
}

initSimulationAccess();
