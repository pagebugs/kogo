# 개발 환경 명령어 가이드

## 1. WSL에서 PHP 서비스 실행

```bash
# PHP 내장 서버 실행 (프로젝트 루트에서)
php -S localhost:8080

# 특정 폴더를 document root로 지정
php -S localhost:8080 -t ./touch

# 백그라운드 실행
php -S localhost:8080 &
```

---

## 2. Node.js 서버 실행

```bash
# 프로젝트 폴더에서 실행
cd ~/projects/project01

# 서버 시작
node server.js

# 백그라운드 실행
node server.js &

# 포트 확인
lsof -i :3000

# 프로세스 종료
kill $(lsof -t -i:3000)
```

---

## 3. MariaDB 데이터 테스트

### 접속 (WSL 터미널)
```bash
# 일반 접속
mysql -u touchad_dev -pdevpass kogha0000

# 로컬 접속 (권한 문제 시)
sudo mysql -u root
```

### 테이블 확인
```sql
-- 모든 테이블 보기
SHOW TABLES;

-- 테이블 스키마 확인
DESCRIBE session;
DESCRIBE simulation;
DESCRIBE inquiry;
DESCRIBE event_log;
```

### 데이터 조회
```sql
-- 세션 목록
SELECT * FROM session ORDER BY created_at DESC LIMIT 10;

-- 시뮬레이션 목록
SELECT sim_uuid, session_id, created_at FROM simulation ORDER BY created_at DESC LIMIT 10;

-- Inquiry 목록
SELECT inquiry_id, session_id, status, created_at FROM inquiry ORDER BY created_at DESC LIMIT 10;

-- 이벤트 로그
SELECT id, event_type, created_at FROM event_log ORDER BY created_at DESC LIMIT 10;
```

### 테스트 데이터 삽입 (예시)
```sql
-- 세션 생성
INSERT INTO session (session_id, user_agent) VALUES ('test_session_001', 'TestAgent/1.0');

-- 조회 확인
SELECT * FROM session WHERE session_id = 'test_session_001';
```

### 데이터 정리
```sql
-- 테스트 데이터 삭제
DELETE FROM session WHERE session_id LIKE 'test_%';
DELETE FROM inquiry WHERE session_id LIKE 'test_%';
```

---

## 4. 자주 사용하는 스크립트

```bash
# DB 초기화 스크립트
node scripts/init_session.js
node scripts/init_inquiry.js

# DB 마이그레이션
node scripts/migrate_simulation_fk.js
node scripts/migrate_inquiry_contextual.js
```

---

## 5. API 테스트 (curl)

```bash
# 세션 생성
curl -X POST http://localhost:3000/api/session \
  -H "Content-Type: application/json" \
  -d '{"session_id":"test_001","user_agent":"Test"}'

# 세션 조회
curl http://localhost:3000/api/session/test_001

# Inquiry 생성
curl -X POST http://localhost:3000/api/inquiry \
  -H "Content-Type: application/json" \
  -d '{"session_id":"test_001","content":"Test question","password":"1234","context_snapshot":{"total":12500}}'
```