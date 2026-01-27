/**
 * 회원 시스템 DB 마이그레이션 스크립트
 * 
 * 수행 작업:
 * 1. user 테이블 확장 (member_type, position, kakao_*, verification_*, organization_id)
 * 2. organization 테이블 신규 생성
 * 
 * 실행: node scripts/migrate_member_system.js
 */

const mysql = require('mysql2/promise');

async function migrateMemberSystem() {
    console.log('=== 회원 시스템 마이그레이션 시작 ===\n');

    const config = {
        host: 'localhost',
        user: 'touchad_dev',
        password: 'devpass',
        database: 'kogha0000'
    };

    let connection;
    try {
        connection = await mysql.createConnection(config);
        console.log('✅ MariaDB 연결 성공\n');

        // ===== 1. organization 테이블 생성 =====
        console.log('📦 1. organization 테이블 생성...');
        const createOrganizationTable = `
            CREATE TABLE IF NOT EXISTS organization (
                id INT AUTO_INCREMENT PRIMARY KEY,
                org_code VARCHAR(20) NOT NULL UNIQUE COMMENT '조직 고유 코드 (예: ORG-001)',
                org_name VARCHAR(200) NOT NULL COMMENT '업체명 (조합사명)',
                org_type ENUM('COOP', 'ASSOCIATE_COOP', 'PARTNER_CORP') NOT NULL 
                    COMMENT 'COOP=조합사, ASSOCIATE_COOP=준조합사, PARTNER_CORP=파트너법인',
                
                business_number VARCHAR(20) DEFAULT NULL COMMENT '사업자등록번호',
                division VARCHAR(100) DEFAULT NULL COMMENT '소속 분과 (옵션)',
                
                status ENUM('ACTIVE', 'INACTIVE', 'PENDING') DEFAULT 'ACTIVE' COMMENT '조직 상태',
                
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                INDEX idx_org_type (org_type),
                INDEX idx_status (status),
                INDEX idx_business_number (business_number)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            COMMENT='조합사/준조합사/파트너법인 조직 정보';
        `;
        await connection.execute(createOrganizationTable);
        console.log('   ✅ organization 테이블 생성 완료\n');

        // ===== 2. user 테이블 컬럼 추가 =====
        console.log('📦 2. user 테이블 확장...');

        // 기존 컬럼 확인 함수
        const columnExists = async (tableName, columnName) => {
            const [rows] = await connection.execute(
                `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
                 WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
                [config.database, tableName, columnName]
            );
            return rows.length > 0;
        };

        // 추가할 컬럼 목록
        const userColumns = [
            { name: 'position', sql: `ADD COLUMN position VARCHAR(100) DEFAULT NULL COMMENT '직책' AFTER company` },
            { name: 'member_type', sql: `ADD COLUMN member_type ENUM('ADMIN', 'COOP_MEMBER', 'COOP_ASSOCIATE', 'PARTNER', 'GENERAL') DEFAULT 'GENERAL' COMMENT '회원 유형' AFTER status` },
            { name: 'kakao_id', sql: `ADD COLUMN kakao_id BIGINT UNIQUE DEFAULT NULL COMMENT '카카오 계정 고유 ID' AFTER member_type` },
            { name: 'kakao_email', sql: `ADD COLUMN kakao_email VARCHAR(255) DEFAULT NULL COMMENT '카카오 프로필 이메일' AFTER kakao_id` },
            { name: 'kakao_nickname', sql: `ADD COLUMN kakao_nickname VARCHAR(100) DEFAULT NULL COMMENT '카카오 닉네임' AFTER kakao_email` },
            { name: 'kakao_linked_at', sql: `ADD COLUMN kakao_linked_at DATETIME DEFAULT NULL COMMENT '카카오 연동 시각' AFTER kakao_nickname` },
            { name: 'verification_status', sql: `ADD COLUMN verification_status ENUM('NONE', 'PENDING', 'APPROVED', 'REJECTED') DEFAULT 'NONE' COMMENT '자격 확인 상태 (PARTNER용)' AFTER kakao_linked_at` },
            { name: 'verified_at', sql: `ADD COLUMN verified_at DATETIME DEFAULT NULL COMMENT '승인 시각' AFTER verification_status` },
            { name: 'verified_by', sql: `ADD COLUMN verified_by INT DEFAULT NULL COMMENT '승인 관리자 ID' AFTER verified_at` },
            { name: 'organization_id', sql: `ADD COLUMN organization_id INT DEFAULT NULL COMMENT '소속 조직 ID (FK)' AFTER verified_by` }
        ];

        for (const col of userColumns) {
            if (await columnExists('user', col.name)) {
                console.log(`   ⏩ ${col.name} 컬럼 이미 존재`);
            } else {
                await connection.execute(`ALTER TABLE user ${col.sql}`);
                console.log(`   ✅ ${col.name} 컬럼 추가 완료`);
            }
        }

        // 인덱스 추가 (에러 무시)
        console.log('\n📦 3. 인덱스 추가...');
        const indexes = [
            { name: 'idx_member_type', sql: 'CREATE INDEX idx_member_type ON user (member_type)' },
            { name: 'idx_verification_status', sql: 'CREATE INDEX idx_verification_status ON user (verification_status)' },
            { name: 'idx_organization_id', sql: 'CREATE INDEX idx_organization_id ON user (organization_id)' }
        ];

        for (const idx of indexes) {
            try {
                await connection.execute(idx.sql);
                console.log(`   ✅ ${idx.name} 인덱스 추가 완료`);
            } catch (err) {
                if (err.code === 'ER_DUP_KEYNAME') {
                    console.log(`   ⏩ ${idx.name} 인덱스 이미 존재`);
                } else {
                    throw err;
                }
            }
        }

        // ===== 4. password_hash NULL 허용 (카카오 로그인 대비) =====
        console.log('\n📦 4. password_hash NULL 허용 설정...');
        try {
            await connection.execute(`ALTER TABLE user MODIFY password_hash VARCHAR(255) NULL`);
            console.log('   ✅ password_hash NULL 허용 완료');
        } catch (err) {
            console.log('   ⏩ 이미 NULL 허용 상태');
        }

        // ===== 결과 확인 =====
        console.log('\n📋 최종 스키마 확인:');
        
        console.log('\n[user 테이블]');
        const [userCols] = await connection.execute('DESCRIBE user');
        console.table(userCols.map(c => ({ Field: c.Field, Type: c.Type, Null: c.Null })));

        console.log('\n[organization 테이블]');
        const [orgCols] = await connection.execute('DESCRIBE organization');
        console.table(orgCols.map(c => ({ Field: c.Field, Type: c.Type, Null: c.Null })));

        console.log('\n=== ✅ 마이그레이션 완료 ===');

    } catch (err) {
        console.error('\n❌ 마이그레이션 실패:', err.message);
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
}

migrateMemberSystem();
