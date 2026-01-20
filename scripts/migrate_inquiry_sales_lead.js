/**
 * Inquiry → Sales Lead 마이그레이션 스크립트
 * 
 * 변경 사항:
 * - content, password_hash, title 컬럼 제거
 * - contact_phone, contact_email, interest_tags 컬럼 추가
 * - status ENUM 재정의: new, contacted, qualified, converted
 */

const mysql = require('mysql2/promise');

const dbConfig = {
    host: 'localhost',
    user: 'touchad_dev',
    password: 'devpass',
    database: 'kogha0000'
};

async function migrate() {
    const conn = await mysql.createConnection(dbConfig);
    console.log('[Migration] Connected to database');

    try {
        // 1. 현재 테이블 구조 확인
        console.log('[Migration] Checking current table structure...');
        const [columns] = await conn.query(`
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'kogha0000' AND TABLE_NAME = 'inquiry'
        `);
        
        const existingColumns = columns.map(c => c.COLUMN_NAME);
        console.log('[Migration] Existing columns:', existingColumns.join(', '));

        // 2. 새 컬럼 추가 (contact_phone, contact_email, interest_tags)
        if (!existingColumns.includes('contact_phone')) {
            console.log('[Migration] Adding contact_phone column...');
            await conn.query(`
                ALTER TABLE inquiry 
                ADD COLUMN contact_phone VARCHAR(20) NULL 
                COMMENT '연락처 전화번호'
            `);
        }

        if (!existingColumns.includes('contact_email')) {
            console.log('[Migration] Adding contact_email column...');
            await conn.query(`
                ALTER TABLE inquiry 
                ADD COLUMN contact_email VARCHAR(100) NULL 
                COMMENT '연락처 이메일'
            `);
        }

        if (!existingColumns.includes('interest_tags')) {
            console.log('[Migration] Adding interest_tags column...');
            await conn.query(`
                ALTER TABLE inquiry 
                ADD COLUMN interest_tags JSON NULL 
                COMMENT '관심 포인트 태그 배열'
            `);
        }

        // 3. 기존 컬럼 deprecated 처리 (데이터 보존을 위해 삭제 대신 주석 변경)
        if (existingColumns.includes('content')) {
            console.log('[Migration] Marking content as deprecated...');
            await conn.query(`
                ALTER TABLE inquiry 
                MODIFY COLUMN content TEXT NULL 
                COMMENT '[DEPRECATED] 기존 질문 내용 - Sales Lead로 전환됨'
            `);
        }

        if (existingColumns.includes('password_hash')) {
            console.log('[Migration] Marking password_hash as deprecated...');
            await conn.query(`
                ALTER TABLE inquiry 
                MODIFY COLUMN password_hash VARCHAR(64) NULL 
                COMMENT '[DEPRECATED] 비밀번호 해시 - Sales Lead로 전환됨'
            `);
        }

        if (existingColumns.includes('title')) {
            console.log('[Migration] Marking title as deprecated...');
            await conn.query(`
                ALTER TABLE inquiry 
                MODIFY COLUMN title VARCHAR(200) NULL 
                COMMENT '[DEPRECATED] 제목 - Sales Lead로 전환됨'
            `);
        }

        // 4. status ENUM 재정의
        console.log('[Migration] Updating status ENUM...');
        await conn.query(`
            ALTER TABLE inquiry 
            MODIFY COLUMN status ENUM('open','referenced','used_for_order','archived','new','contacted','qualified','converted') 
            DEFAULT 'new'
            COMMENT 'Sales Lead 상태: new → contacted → qualified → converted'
        `);

        // 5. 테이블 주석 업데이트
        console.log('[Migration] Updating table comment...');
        await conn.query(`
            ALTER TABLE inquiry 
            COMMENT = 'Sales Lead (컨텍스트 기반 세일즈 리드) - 특정 데이터를 확인한 사용자가 설명/상담을 요청한 기록'
        `);

        // 6. 최종 구조 확인
        const [newColumns] = await conn.query(`
            SELECT COLUMN_NAME, COLUMN_TYPE, COLUMN_COMMENT 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'kogha0000' AND TABLE_NAME = 'inquiry'
            ORDER BY ORDINAL_POSITION
        `);

        console.log('\n[Migration] Final table structure:');
        newColumns.forEach(col => {
            const deprecated = col.COLUMN_COMMENT?.includes('DEPRECATED') ? ' ⚠️' : '';
            console.log(`  - ${col.COLUMN_NAME}: ${col.COLUMN_TYPE}${deprecated}`);
        });

        console.log('\n✅ Migration completed successfully!');

    } catch (err) {
        console.error('[Migration] Error:', err.message);
    } finally {
        await conn.end();
    }
}

migrate();
