# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

터치애드(TouchAd) - 한국글로벌헬스케어협동조합(Kogo) SaaS 웹 플랫폼의 하위 서비스. 신용카드 및 교통카드 결제 데이터를 활용한 위치 기반 의료 타겟팅 광고 플랫폼의 가치제안 페이지(랜딩페이지) 프로토타입.

## Commands

```bash
# Start local development server (Express + MySQL)
node server.js

# Deploy to production server
./tools/deploy.sh
```

The development server runs on `http://localhost:3000` and requires MySQL with the `kogha0000` database.

## Architecture

### Frontend (Static HTML + CSS + JS)
- **`touch/`**: Main service pages (landing page, results)
  - `index.html`: Value proposition landing page
  - `newresult.html`: Data analysis result page
- **`assets/`**: Shared assets across all pages
  - `css/style.css`: Main design tokens and component styles (BW grayscale, SUIT font, 12-column grid)
  - `css/gnb.css`: Global navigation styles
  - `js/config.js`: API keys configuration (Kakao Maps, GPT)
  - `js/gnb.js`: Navigation logic
  - `js/gptInsight.js`: GPT insight generation
  - `js/ui-loader.js`: Dynamic header/footer loading
- **`css/styles.css`**: Legacy token file (navigation/header components)
- **`inc/`**: Shared HTML partials (header.html, footer.html)

### Backend (Express + MySQL)
- **`server.js`**: API server handling:
  - Session management (`/api/session`)
  - Simulation data storage (`/api/simulation`)
  - Event logging (`/api/log-event`)
  - Sales leads / Inquiry (`/api/inquiry`)

### External Integrations
- **Daum Postcode API**: Address search in service trial modal
- **Runcomm API**: Card transaction data (`https://t.at.runcomm.co.kr/service/v1/post/health/care`)
- **Kakao Maps API**: Heatmap visualization
- **OpenAI GPT**: AI insight generation for results

## Design System

- **Layout**: 12-column grid, 1920px PC / 720px mobile breakpoint
- **Typography**: SUIT font (variable weight)
- **Colors**: BW grayscale (placeholder for final design)
- **CSS Variables**: All tokens defined in `:root` of `assets/css/style.css`

## Agent Rules

See `.agent/agent.md` for AI agent behavior guidelines. Key principles:
- **Execution over Assumption**: Only runtime-verified results count
- **Runtime is the Truth**: Code existence ≠ working functionality
- **Verified Behavior**: Code changes require actual UI/behavior verification

## Communication

한글로 커뮤니케이션 (Communicate in Korean). 주석작업, 문서작업 포함
