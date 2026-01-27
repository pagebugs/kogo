/**
 * 회원 시스템 UI 테스트를 위한 샘플 데이터 생성 스크립트
 */

const mysql = require('mysql2/promise');

async function createSampleData() {
    console.log('=== 샘플 데이터 생성 시작 ===\n');

    const config = {
        host: 'localhost',
        user: 'touchad_dev',
        password: 'devpass',
        database: 'kogha0000'
    };

    let connection;
    try {
        connection = await mysql.createConnection(config);

        // 1. 조직(조합사) 샘플 데이터
        console.log('📦 1. 조직 샘플 데이터 삽입...');
        const orgs = [
            ['ORG-001', '서울디지털조합', 'COOP', '123-45-67890', '강남지부'],
            ['ORG-002', '경기테크협회', 'ASSOCIATE_COOP', '234-56-78901', '판교본부'],
            ['ORG-003', '한국파트너스', 'PARTNER_CORP', '345-67-89012', '솔루션사업부']
        ];

        await connection.query('DELETE FROM organization');
        await connection.query(
            'INSERT INTO organization (org_code, org_name, org_type, business_number, division) VALUES ?',
            [orgs]
        );
        console.log('   ✅ 조직 3건 삽입 완료');

        // 2. 테스트 유저 샘플 데이터
        console.log('\n📦 2. 테스트 유저 데이터 삽입...');
        
        // 조직 ID 가져오기
        const [orgRows] = await connection.query('SELECT id, org_name FROM organization');
        const orgMap = {};
        orgRows.forEach(row => orgMap[row.org_name] = row.id);

        const users = [
            ['admin@kogo.com', 'admin_pass', '슈퍼관리자', 'ADMIN', 'active', null],
            ['coop1@test.com', 'pass123', '김조합', 'COOP_MEMBER', 'active', orgMap['서울디지털조합']],
            ['assoc1@test.com', 'pass123', '이준회', 'COOP_ASSOCIATE', 'active', orgMap['경기테크협회']],
            ['partner1@test.com', 'pass123', '박파트너', 'PARTNER', 'pending', orgMap['한국파트너스']],
            ['general1@test.com', 'pass123', '최일반', 'GENERAL', 'active', null]
        ];

        // user 테이블은 기존 데이터가 있을 수 있으므로 중복 제외하고 삽입 시도하거나 초기화
        // 테스트 편의를 위해 일단 초기화 (주의: 기존 회원이 있다면 백업 필요)
        // await connection.query('DELETE FROM user'); 
        
        for (const u of users) {
            try {
                await connection.execute(
                    `INSERT INTO user (email, password_hash, name, member_type, status, organization_id) 
                     VALUES (?, ?, ?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE member_type = VALUES(member_type), status = VALUES(status), organization_id = VALUES(organization_id)`,
                    u
                );
            } catch (err) {
                console.warn(`   ⚠️ 유저 ${u[0]} 삽입 실패: ${err.message}`);
            }
        }
        console.log('   ✅ 테스트 유저 5건 삽입/업데이트 완료');

        console.log('\n=== ✅ 샘플 데이터 생성 완료 ===');

    } catch (err) {
        console.error('\n❌ 실패:', err.message);
    } finally {
        if (connection) await connection.end();
    }
}

createSampleData();
