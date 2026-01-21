/**
 * DB 스키마 조회 및 Markdown 문서용 데이터 추출
 */
const mysql = require('mysql2/promise');

async function extractSchema() {
    const config = {
        host: 'localhost',
        user: 'touchad_dev',
        password: 'devpass',
        database: 'kogha0000'
    };

    let conn;
    try {
        conn = await mysql.createConnection(config);
        
        // 1. 테이블 목록 조회
        const [tables] = await conn.execute("SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'");
        const tableNames = tables.map(t => Object.values(t)[0]);

        const schemaData = {};

        for (const tableName of tableNames) {
            // 2. 각 테이블 컬럼 상세 조회
            const [columns] = await conn.execute(`SHOW FULL COLUMNS FROM \`${tableName}\``);
            schemaData[tableName] = columns;
        }

        // 3. Markdown 포맷으로 출력
        console.log('# TouchAd Database Schema Documentation\n');
        console.log(`Last Updated: ${new Date().toISOString().split('T')[0]}\n`);
        
        console.log('## 📋 Table of Contents');
        for (const tableName of tableNames) {
            console.log(`- [${tableName}](#${tableName})`);
        }
        console.log('\n---');

        for (const tableName of tableNames) {
            console.log(`\n## ${tableName}`);
            console.log('| Column | Type | Null | Key | Default | Extra | Comment |');
            console.log('|---|---|---|---|---|---|---|');

            for (const col of schemaData[tableName]) {
                const nullStr = col.Null === 'YES' ? 'NULL' : 'NOT NULL';
                const defaultStr = col.Default === null ? 'NULL' : col.Default;
                // Markdown 테이블 깨짐 방지를 위해 파이프(|) 이스케이프
                const comment = col.Comment ? col.Comment.replace(/\|/g, '\\|') : ''; 
                
                console.log(`| **${col.Field}** | ${col.Type} | ${nullStr} | ${col.Key} | ${defaultStr} | ${col.Extra} | ${comment} |`);
            }
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        if (conn) await conn.end();
    }
}

extractSchema();
