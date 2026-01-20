#!/bin/bash

# Configuration
HOST="146.56.175.219"
USER="kogha0000"
BACKUP_DIR="backup_$(date +%Y%m%d)"
PORT="22"

echo "=========================================="
echo " [TouchAd] 운영 서버 배포 스크립트"
echo "------------------------------------------"
echo " 접속 정보: $USER@$HOST (Port $PORT)"
echo " 백업 폴더: $BACKUP_DIR"
echo "=========================================="
echo ""
echo "!!! [중요] 비밀번호 입력 요청 시 아래 비밀번호를 입력하세요."
echo "!!! Password: polestar4621!"
echo ""

# 1. Backup Existing Files
echo ">> [1/2] 기존 파일 백업 진행 중..."
echo "   (대상: *.html, *.php, css, js, assets, inc)"
# mv 명령어가 실패하더라도(파일이 없을 경우 등) 스크립트가 멈추지 않도록 처리
ssh -p $PORT -o StrictHostKeyChecking=no $USER@$HOST "mkdir -p $BACKUP_DIR && mv *.html *.php css js assets inc $BACKUP_DIR/ 2>/dev/null || echo '   (안내: 백업할 파일이 없거나 이미 정리됨)'"

echo ""

# 2. Upload New Files
echo ">> [2/2] 새 프로젝트 파일 업로드 중 (touch 폴더 내용)..."
# touch 폴더 내의 모든 파일을 서버의 홈 디렉토리(웹 루트 가정)로 업로드
scp -P $PORT -r -o StrictHostKeyChecking=no touch/* $USER@$HOST:./

echo ""
echo "=========================================="
echo " 배포가 완료되었습니다."
echo "=========================================="
