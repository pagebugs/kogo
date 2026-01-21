const mysql = require('mysql2/promise');

const dbConfig = {
    host: 'localhost',
    user: 'touchad_dev',
    password: 'devpass',
    database: 'kogha0000'
};

async function migrate() {
    const connection = await mysql.createConnection(dbConfig);
    console.log('[Migration] Connected to database...');

    try {
        // Inquiry 테이블에 source_page 컬럼 추가
        console.log('[Migration] Adding source_page column to inquiry table...');
        await connection.query(`
            ALTER TABLE inquiry
            ADD COLUMN IF NOT EXISTS source_page VARCHAR(255) NULL 
            COMMENT 'Entry page URL (index.html, newresult.html 등)'
            AFTER source_type;
        `);

        // 확인
        const [cols] = await connection.query("SHOW COLUMNS FROM inquiry LIKE 'source_page'");
        if (cols.length) {
            console.log('✅ inquiry.source_page 컬럼 추가 완료');
        }

        console.log('[Migration] source_page migration completed successfully.');

    } catch (err) {
        console.error('[Migration] Failed:', err);
    } finally {
        await connection.end();
    }
}

migrate();
