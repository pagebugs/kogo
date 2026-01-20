const mysql = require('mysql2/promise');

/**
 * Inquiry 테이블 마이그레이션: Contextual Inquiry로 재정의
 * 
 * 변경 사항:
 * 1. context_snapshot JSON 필드 추가 (시뮬레이션 데이터 맥락 스냅샷)
 * 2. title → optional (NOT NULL 제거)
 * 3. contact_info → deprecated (주석 추가)
 * 4. status ENUM 재정의 (OPEN, REFERENCED, USED_FOR_ORDER, ARCHIVED)
 * 
 * ⚠️ 기존 데이터 보존 전략:
 * - ALTER TABLE로 컬럼 수정 (DROP 하지 않음)
 * - 기존 데이터는 그대로 유지
 */
async function migrateInquiryContextual() {
    console.log('=== Migrating Inquiry to Contextual Inquiry ===');

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

        // Step 1: context_snapshot 컬럼 추가
        console.log('\n[Step 1] Adding context_snapshot column...');
        try {
            await connection.execute(`
                ALTER TABLE inquiry 
                ADD COLUMN context_snapshot JSON DEFAULT NULL 
                COMMENT 'Simulation context snapshot at inquiry creation time'
                AFTER sim_uuid
            `);
            console.log('✅ context_snapshot column added');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('ℹ️ context_snapshot column already exists');
            } else {
                throw err;
            }
        }

        // Step 2: title을 optional로 변경 (NOT NULL → NULL 허용)
        console.log('\n[Step 2] Making title optional...');
        await connection.execute(`
            ALTER TABLE inquiry 
            MODIFY COLUMN title VARCHAR(255) DEFAULT NULL 
            COMMENT 'Internal identifier (optional, deprecated as primary field)'
        `);
        console.log('✅ title is now optional');

        // Step 3: contact_info에 deprecated 주석 추가
        console.log('\n[Step 3] Marking contact_info as deprecated...');
        await connection.execute(`
            ALTER TABLE inquiry 
            MODIFY COLUMN contact_info VARCHAR(255) DEFAULT NULL 
            COMMENT 'DEPRECATED - Do not use for Contextual Inquiry'
        `);
        console.log('✅ contact_info marked as deprecated');

        // Step 4: status ENUM 재정의
        console.log('\n[Step 4] Redefining status ENUM...');
        await connection.execute(`
            ALTER TABLE inquiry 
            MODIFY COLUMN status ENUM('open', 'referenced', 'used_for_order', 'archived') 
            DEFAULT 'open' 
            COMMENT 'Contextual Inquiry lifecycle status'
        `);
        console.log('✅ status ENUM redefined');

        // Step 5: 테이블 및 컬럼 COMMENT 업데이트
        console.log('\n[Step 5] Updating table comment...');
        await connection.execute(`
            ALTER TABLE inquiry 
            COMMENT='Contextual Inquiry: User questions captured at specific data context points (NOT a CS ticket system)'
        `);
        console.log('✅ Table comment updated');

        // 최종 스키마 확인
        console.log('\n=== Final Schema ===');
        const [rows] = await connection.execute('DESCRIBE inquiry');
        console.table(rows);

        console.log('\n=== Migration Complete ===');
        console.log('⚠️ Remember: Inquiry is NOT a CS ticket. It captures where user understanding stopped.');

    } catch (err) {
        console.error('Migration Error:', err);
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
}

migrateInquiryContextual();
