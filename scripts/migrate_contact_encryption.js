/**
 * Inquiry 테이블 contact 컬럼 크기 확장 마이그레이션
 * 
 * 이유: 암호화된 contact 데이터가 기존 VARCHAR(20), VARCHAR(100)보다 김
 * 변경: VARCHAR(255)로 확장
 */

const mysql = require('mysql2/promise');

async function migrate() {
    console.log('=== Migrating Inquiry Contact Columns ===');

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

        // contact_phone 컬럼 확장
        console.log('\n[Step 1] Expanding contact_phone column...');
        await connection.execute(`
            ALTER TABLE inquiry 
            MODIFY COLUMN contact_phone VARCHAR(255) NULL 
            COMMENT '연락처 전화번호 (암호화됨)'
        `);
        console.log('✅ contact_phone expanded to VARCHAR(255)');

        // contact_email 컬럼 확장
        console.log('\n[Step 2] Expanding contact_email column...');
        await connection.execute(`
            ALTER TABLE inquiry 
            MODIFY COLUMN contact_email VARCHAR(500) NULL 
            COMMENT '연락처 이메일 (암호화됨)'
        `);
        console.log('✅ contact_email expanded to VARCHAR(500)');

        // 스키마 확인
        console.log('\n=== Updated Schema ===');
        const [rows] = await connection.execute(`
            SELECT COLUMN_NAME, COLUMN_TYPE, COLUMN_COMMENT 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'kogha0000' AND TABLE_NAME = 'inquiry'
            AND COLUMN_NAME IN ('contact_phone', 'contact_email')
        `);
        console.table(rows);

        console.log('\n=== Migration Complete ===');

    } catch (err) {
        console.error('Migration Error:', err);
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
}

migrate();
