const mysql = require('mysql2/promise');

/**
 * Simulation 테이블에 Session FK 연결
 * 
 * 작업 내용:
 * 1. simulation.session_id VARCHAR(50) → VARCHAR(64) 변경
 * 2. 기존 orphan session_id를 session 테이블에 자동 등록
 * 3. FK 제약조건 추가 (선택사항 - 주석 처리)
 */
async function migrateSimulationFK() {
    console.log('=== Simulation FK Migration Start ===');

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

        // Step 1: session_id 컬럼 타입 변경 (VARCHAR(50) → VARCHAR(64))
        console.log('\n[Step 1] Altering simulation.session_id type...');
        await connection.execute(`
            ALTER TABLE simulation 
            MODIFY COLUMN session_id VARCHAR(64) NOT NULL 
            COMMENT 'Session ID (FK to session.session_id)'
        `);
        console.log('✅ session_id type changed to VARCHAR(64)');

        // Step 2: 기존 orphan session_id들을 session 테이블에 등록
        console.log('\n[Step 2] Registering orphan session_ids to session table...');
        const [orphans] = await connection.execute(`
            SELECT DISTINCT s.session_id 
            FROM simulation s 
            LEFT JOIN session sess ON s.session_id = sess.session_id 
            WHERE sess.session_id IS NULL
        `);

        if (orphans.length > 0) {
            console.log(`Found ${orphans.length} orphan session(s)`);
            for (const row of orphans) {
                await connection.execute(
                    `INSERT INTO session (session_id, user_agent) VALUES (?, ?)`,
                    [row.session_id, 'Migrated from simulation (orphan)']
                );
                console.log(`  → Registered: ${row.session_id}`);
            }
        } else {
            console.log('No orphan sessions found');
        }

        // Step 3: INDEX 확인 및 추가
        console.log('\n[Step 3] Ensuring index on session_id...');
        const [indexes] = await connection.execute(`
            SHOW INDEX FROM simulation WHERE Column_name = 'session_id'
        `);
        if (indexes.length === 0) {
            await connection.execute(`
                ALTER TABLE simulation ADD INDEX idx_session_id (session_id)
            `);
            console.log('✅ Index added');
        } else {
            console.log('✅ Index already exists');
        }

        // Step 4: FK 제약조건 (선택사항 - 유연성을 위해 주석 처리)
        // 비로그인 환경에서 session이 나중에 생성될 수 있으므로, 
        // 실제 FK 제약조건은 비즈니스 로직으로 관리하는 것이 더 유연함
        /*
        console.log('\n[Step 4] Adding FK constraint...');
        await connection.execute(`
            ALTER TABLE simulation 
            ADD CONSTRAINT fk_simulation_session 
            FOREIGN KEY (session_id) REFERENCES session(session_id)
            ON DELETE CASCADE ON UPDATE CASCADE
        `);
        console.log('✅ FK constraint added');
        */
        console.log('\n[Step 4] FK constraint skipped (managed by application logic)');

        // 최종 스키마 확인
        console.log('\n=== Final Schema ===');
        const [rows] = await connection.execute('DESCRIBE simulation');
        console.table(rows);

        console.log('\n=== Migration Complete ===');

    } catch (err) {
        console.error('Migration Error:', err);
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
}

migrateSimulationFK();
