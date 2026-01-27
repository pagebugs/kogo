# Repository Guidelines

## Project Structure & Module Organization
- `server.js` hosts the Express API (port 3000) and MySQL connection logic.
- Front-end assets are in `index.html`, `css/`, `js/`, `assets/`, and `admin/`.
- Shared helpers live under `utils/`, `common/`, `inc/`, and `nav/`.
- Database setup and migrations live in `scripts/` (e.g., `setup_db.js`, `init_*.js`, `migrate_*.js`).
- Misc tooling and checks live in `tools/` (e.g., `bridge_test.php`).
- Documentation and notes are in `docs/` and `task.md`.

## Build, Test, and Development Commands
- `npm install` — installs runtime dependencies (no npm scripts are defined).
- `node server.js` — starts the API server on port 3000.
- `node scripts/setup_db.js` — creates the local MariaDB database/user for dev.
- `node scripts/init_session.js` (and other `init_*.js`) — creates required tables.
- `node scripts/db_test.js` — quick DB connectivity and CRUD smoke test.
- Example API check: `curl http://localhost:3000/api/health`.

## Coding Style & Naming Conventions
- JavaScript uses CommonJS (`require`) and semicolons; follow the 4-space indentation in existing files.
- Keep file and directory names lowercase; scripts and utilities generally use lower_snake_case (e.g., `crypto_utils.js`).
- Prefer small, focused modules in `utils/` and `scripts/` rather than large monolithic files.

## Testing Guidelines
- No formal test runner is configured. Use script-based checks (`scripts/db_test.js`) and manual API calls.
- When adding new DB tables or APIs, add a small `scripts/init_*.js` or `migrate_*.js` helper and document how to run it.

## Commit & Pull Request Guidelines
- Commit messages are short, descriptive, and often sentence-case; conventional commits are not required.
- PRs should include: a concise summary, linked issues (if any), and screenshots for UI changes under `admin/` or `index.html`.
- Highlight any schema changes and the exact migration/init script to run.

## Security & Configuration Tips
- Local DB credentials and schema names are defined in `server.js` and setup scripts; update for non-dev environments.
- `ADMIN_API_KEY` can be set via environment variable; avoid committing real secrets.
