const mysql = require('mysql2/promise');

const dbConfig = {
    host: 'localhost',
    user: 'touchad_dev',
    password: 'devpass',
    database: 'kogha0000',
    multipleStatements: true
};

async function migrate() {
    const connection = await mysql.createConnection(dbConfig);
    console.log('[Migration] Connected to database...');

    try {
        // 1. Order Table Updates
        // - Add created_by_admin_id (VARCHAR(64))
        // - Add decision_snapshot (JSON)
        // - Add archived_at (TIMESTAMP NULL)
        console.log('[Migration] Altering `order` table...');
        await connection.query(`
            ALTER TABLE \`order\`
            ADD COLUMN IF NOT EXISTS created_by_admin_id VARCHAR(64) NULL COMMENT 'Admin ID (책임 소재)',
            ADD COLUMN IF NOT EXISTS decision_snapshot JSON NULL COMMENT 'Order 생성 시점의 판단 근거',
            ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP NULL COMMENT 'Soft delete';
        `);

        // 2. Inquiry Table Updates
        // - Add source_type (ENUM)
        // - Add archived_at (TIMESTAMP NULL)
        console.log('[Migration] Altering `inquiry` table...');
        await connection.query(`
            ALTER TABLE inquiry
            ADD COLUMN IF NOT EXISTS source_type ENUM('analysis','simulation','direct') NULL COMMENT 'Entry point tracking',
            ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP NULL COMMENT 'Soft delete (숨김 처리)';
        `);

        // 3. InsightReport Table Updates
        // - Add report_version (VARCHAR(10))
        // - Add archived_at (TIMESTAMP NULL)
        console.log('[Migration] Altering `insight_report` table...');
        await connection.query(`
            ALTER TABLE insight_report
            ADD COLUMN IF NOT EXISTS report_version VARCHAR(10) NULL COMMENT '리포트 로직 버전 (v1.0 등)',
            ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP NULL COMMENT 'Soft delete';
        `);

        // 4. SimulationAccess Table Updates
        // - Add grant_reason (ENUM)
        // - Update source column definition (ENUM) if needed (assuming existing is compatible)
        console.log('[Migration] Altering `simulation_access` table...');
        await connection.query(`
            ALTER TABLE simulation_access
            ADD COLUMN IF NOT EXISTS grant_reason ENUM('login','manual','share') NULL COMMENT '권한 부여 상세 사유 (Audit trail)';
        `);

        // Check columns to verify
        const [orderCols] = await connection.query("SHOW COLUMNS FROM `order` LIKE 'created_by_admin_id'");
        if(orderCols.length) console.log('✅ Order.created_by_admin_id added.');
        
        const [inquiryCols] = await connection.query("SHOW COLUMNS FROM inquiry LIKE 'source_type'");
        if(inquiryCols.length) console.log('✅ Inquiry.source_type added.');

        console.log('[Migration] Phase 1 Schema Migration Completed Successfully.');

    } catch (err) {
        console.error('[Migration] Failed:', err);
    } finally {
        await connection.end();
    }
}

migrate();
