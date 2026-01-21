##whois

kogha.co.kr
서버환경: PHP 7.4.33
MariaDB 10.1.48
3차 도메인: kogha0000.host.whoisweb.net

FTP접속정보
FTP 서버 아이피	146.56.175.219 / 포트번호 22
FTP 아이디	kogha0000
FTP 비번	polestar4621!

DB 접속 호스트	localhost 
DB명 / 아이디	kogha0000 / kogha0000
PW  web@#$0133

## Local Development

> [!CAUTION] 
> **WSL 작업은 "WSL 터미널 안에서만" 한다. Git Bash(MINGW64)에서는 절대 하지 않는다.**

### 터미널 환경 설정 (필수)
1. **Windows Terminal 실행** (시작 메뉴 → Windows Terminal)
2. **탭에서 Ubuntu 선택** (없으면 `wsl` 입력 후 Enter)
3. **프롬프트 확인**: `xray21@ANDY:~$` 형태로 나와야 정상
    - ❌ `MINGW64`
    - ❌ `//wsl$` 경로
    - ✅ `:` 로 경로가 나와야 정상
4. **프로젝트 이동**: `cd ~/projects/project01`
5. **경로 확인**: `pwd` → `/home/xray21/projects/project01`

### 계정 정보 (Accounts)
- **Ubuntu/WSL**: (sudo pw: 8753)
- **Database (MariaDB/MySQL)**:
    - Host: `localhost`
    - User: `touchad_dev`
    - Password: `devpass`
    - Database: `kogha0000` (실제 데이터 저장소)
    - Tables: `event_log`, `simulation`

### 서버 실행 (WSL Ubuntu 내에서)
**Backend (Node.js)**
```bash
node server.js  # Port 3000
```

**Frontend (PHP)**
```bash
# PHP 미설치시: sudo apt update && sudo apt install -y php
php -S localhost:8000
```