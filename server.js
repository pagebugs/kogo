const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bodyParser = require('body-parser');
const { encrypt, decrypt } = require('./utils/crypto_utils');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Database Config
const dbConfig = {
    host: 'localhost',
    user: 'touchad_dev',
    password: 'devpass',
    database: 'kogha0000',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Create Pool
const pool = mysql.createPool(dbConfig);

// Health Check
app.get('/api/health', (req, res) => {
    res.send({ status: 'ok', timestamp: new Date() });
});

// =========================================================
// Session API
// =========================================================

// 1. 세션 생성 (또는 기존 세션 반환)
app.post('/api/session', async (req, res) => {
    const { session_id, user_agent, ip_address, metadata } = req.body;

    if (!session_id) {
        return res.status(400).send({ error: 'session_id is required' });
    }

    try {
        // 먼저 기존 세션 확인
        const [existing] = await pool.execute(
            'SELECT id, session_id, created_at FROM session WHERE session_id = ?',
            [session_id]
        );

        if (existing.length > 0) {
            // 기존 세션 있으면 last_active_at 갱신 후 반환
            await pool.execute(
                'UPDATE session SET last_active_at = CURRENT_TIMESTAMP WHERE session_id = ?',
                [session_id]
            );
            console.log(`[Session] Existing session touched: ${session_id}`);
            return res.status(200).send({ 
                success: true, 
                session_id, 
                is_new: false,
                id: existing[0].id 
            });
        }

        // 새 세션 생성
        const metadataStr = metadata ? JSON.stringify(metadata) : null;
        const [result] = await pool.execute(
            `INSERT INTO session (session_id, user_agent, ip_address, metadata) VALUES (?, ?, ?, ?)`,
            [session_id, user_agent || null, ip_address || null, metadataStr]
        );

        console.log(`[Session] New session created: ${session_id}, ID: ${result.insertId}`);
        res.status(201).send({ 
            success: true, 
            session_id, 
            is_new: true,
            id: result.insertId 
        });
    } catch (err) {
        console.error('DB Error (Session Create):', err);
        res.status(500).send({ error: 'Database error' });
    }
});

// 2. 세션 조회
app.get('/api/session/:sid', async (req, res) => {
    const { sid } = req.params;

    try {
        const [rows] = await pool.execute(
            `SELECT id, session_id, user_id, created_at, expires_at, last_active_at, user_agent, ip_address 
             FROM session WHERE session_id = ?`,
            [sid]
        );

        if (rows.length === 0) {
            return res.status(404).send({ error: 'Session not found' });
        }

        res.status(200).send(rows[0]);
    } catch (err) {
        console.error('DB Error (Session Get):', err);
        res.status(500).send({ error: 'Database error' });
    }
});

// 3. 세션 활성화 (last_active_at 갱신)
app.patch('/api/session/:sid/touch', async (req, res) => {
    const { sid } = req.params;

    try {
        const [result] = await pool.execute(
            'UPDATE session SET last_active_at = CURRENT_TIMESTAMP WHERE session_id = ?',
            [sid]
        );

        if (result.affectedRows === 0) {
            return res.status(404).send({ error: 'Session not found' });
        }

        console.log(`[Session] Touched: ${sid}`);
        res.status(200).send({ success: true });
    } catch (err) {
        console.error('DB Error (Session Touch):', err);
        res.status(500).send({ error: 'Database error' });
    }
});

// Save Simulation Endpoint
app.post('/api/simulation', async (req, res) => {
    const { sim_uuid, session_id, input_data, result_data } = req.body;

    if (!sim_uuid || !session_id) {
        return res.status(400).send({ error: 'sim_uuid and session_id are required' });
    }

    try {
        const query = `
            INSERT INTO simulation (sim_uuid, session_id, input_data, result_data) 
            VALUES (?, ?, ?, ?)
        `;
        
        const inputStr = typeof input_data === 'object' ? JSON.stringify(input_data) : input_data;
        const resultStr = typeof result_data === 'object' ? JSON.stringify(result_data) : result_data;

        const [result] = await pool.execute(query, [sim_uuid, session_id, inputStr, resultStr]);
        
        console.log(`[Simulation Saved] UUID: ${sim_uuid}, ID: ${result.insertId}`);
        res.status(200).send({ success: true, id: result.insertId });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
             console.warn(`[Simulation] Duplicate UUID ignored: ${sim_uuid}`);
             return res.status(409).send({ error: 'Duplicate simulation UUID' });
        }
        console.error('DB Error (Simulation):', err);
        res.status(500).send({ error: 'Database error' });
    }
});

// Event Log Endpoint
app.post('/api/log-event', async (req, res) => {
    const { event_type, payload } = req.body;

    if (!event_type) {
        return res.status(400).send({ error: 'event_type is required' });
    }

    try {
        const query = 'INSERT INTO event_log (event_type, payload) VALUES (?, ?)';
        const payloadStr = typeof payload === 'object' ? JSON.stringify(payload) : payload;
        
        const [result] = await pool.execute(query, [event_type, payloadStr]);
        
        console.log(`[Event Logged] ID: ${result.insertId}, Type: ${event_type}`);
        
        res.status(200).send({ success: true, id: result.insertId });
    } catch (err) {
        console.error('DB Error:', err);
        res.status(500).send({ error: 'Database error' });
    }
});

// =========================================================
// Sales Lead API (Formerly Contextual Inquiry)
// =========================================================
// ⚠️ Inquiry captures where user understanding stopped at a specific data context.
// It serves as a Context-based Sales Lead.
// =========================================================

// =========================================================
// Security Configuration
// =========================================================
const CONTEXT_SNAPSHOT_MAX_SIZE = 50 * 1024; // 50KB
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'dev_admin_key_change_in_prod';

// Inquiry ID generation
function generateInquiryId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `INQ-${timestamp}-${random}`.toUpperCase();
}

// Admin API Key Middleware
function requireAdminKey(req, res, next) {
    const apiKey = req.headers['x-admin-api-key'];
    if (!apiKey || apiKey !== ADMIN_API_KEY) {
        console.warn(`[Security] Unauthorized admin API access attempt from ${req.ip}`);
        return res.status(403).send({ error: 'Forbidden: Invalid admin API key' });
    }
    next();
}

// 1. Create Sales Lead (Contextual Inquiry)
// Required: session_id, contact ({ phone, email }), context_snapshot
// Optional: sim_uuid, interest_tags
app.post('/api/inquiry', async (req, res) => {
    const { session_id, sim_uuid, contact, interest_tags, context_snapshot, content, source_type, source_page, meta } = req.body;

    // Validation: Required fields
    if (!session_id || !contact || !context_snapshot) {
        return res.status(400).send({ 
            error: 'Required fields: session_id, contact, context_snapshot',
            hint: 'contact must be an object with phone or email'
        });
    }

    // Validation: Contact Info (At least one required)
    const phone = contact.phone ? contact.phone.trim() : null;
    const email = contact.email ? contact.email.trim() : null;

    if (!phone && !email) {
         return res.status(400).send({ 
            error: 'Invalid contact info',
            hint: 'At least one of contact.phone or contact.email is required'
        });
    }

    // Validation: source_type (optional, default to null)
    const validSourceTypes = ['analysis', 'simulation', 'direct'];
    const sourceTypeValue = validSourceTypes.includes(source_type) ? source_type : null;

    // Validation: context_snapshot size limit
    const contextStr = typeof context_snapshot === 'object' 
        ? JSON.stringify(context_snapshot) 
        : context_snapshot;
    
    if (contextStr.length > CONTEXT_SNAPSHOT_MAX_SIZE) {
        return res.status(413).send({ 
            error: 'context_snapshot too large',
            max_size: `${CONTEXT_SNAPSHOT_MAX_SIZE / 1024}KB`,
            current_size: `${Math.round(contextStr.length / 1024)}KB`
        });
    }

    try {
        // Validation: session_id must exist in session table
        const [sessionRows] = await pool.execute(
            'SELECT id FROM session WHERE session_id = ?',
            [session_id]
        );
        
        if (sessionRows.length === 0) {
            return res.status(400).send({ 
                error: 'Invalid session_id', 
                hint: 'Session must be registered before creating inquiry'
            });
        }

        const inquiryId = generateInquiryId();
        const interestJson = interest_tags ? JSON.stringify(interest_tags) : null;

        // 연락처 정보 암호화
        const encryptedPhone = phone ? encrypt(phone) : null;
        const encryptedEmail = email ? encrypt(email) : null;

        // meta를 context_snapshot._meta로 병합 (A안: 가볍게 처리)
        let enrichedContextStr = contextStr;
        if (meta) {
            try {
                const parsedContext = JSON.parse(contextStr);
                parsedContext._meta = meta;
                enrichedContextStr = JSON.stringify(parsedContext);
            } catch (e) {
                // context_snapshot이 JSON이 아닌 경우 무시
                console.warn('[Sales Lead] meta merge failed, context is not valid JSON');
            }
        }

        // source_type, source_page 필드 추가 (Phase 1 DB 스키마 동기화)
        await pool.execute(
            `INSERT INTO inquiry 
            (inquiry_id, session_id, sim_uuid, contact_phone, contact_email, interest_tags, context_snapshot, status, content, source_type, source_page) 
            VALUES (?, ?, ?, ?, ?, ?, ?, 'new', ?, ?, ?)`,
            [inquiryId, session_id, sim_uuid || null, encryptedPhone, encryptedEmail, interestJson, enrichedContextStr, content || null, sourceTypeValue, source_page || null]
        );

        console.log(`[Sales Lead] Created: ${inquiryId} (source_type: ${sourceTypeValue || 'N/A'}, source_page: ${source_page || 'N/A'})`);
        
        res.status(201).send({ 
            success: true, 
            message: 'Sales Lead received successfully',
            inquiry_id: inquiryId
        });
    } catch (err) {
        console.error('[Sales Lead] Insert Error:', err);
        res.status(500).send({ error: 'Failed to record sales lead' });
    }
});

// 2. View Sales Lead (Admin Only)
app.post('/api/inquiry/:inquiryId/view', requireAdminKey, async (req, res) => {
    const { inquiryId } = req.params;
    
    // Note: Password verification removed as this is now Admin-only

    try {
        const [rows] = await pool.execute(
            `SELECT inquiry_id, session_id, sim_uuid, context_snapshot, 
                    contact_phone, contact_email, interest_tags,
                    status, admin_reply, replied_at, created_at, updated_at
             FROM inquiry WHERE inquiry_id = ?`,
            [inquiryId]
        );

        if (rows.length === 0) {
            return res.status(404).send({ error: 'Sales Lead not found' });
        }

        const inquiry = rows[0];

        // Parse JSON fields
        if (inquiry.context_snapshot && typeof inquiry.context_snapshot === 'string') {
            try { inquiry.context_snapshot = JSON.parse(inquiry.context_snapshot); } catch (e) {}
        }
        if (inquiry.interest_tags && typeof inquiry.interest_tags === 'string') {
            try { inquiry.interest_tags = JSON.parse(inquiry.interest_tags); } catch (e) {}
        }

        // 연락처 정보 복호화 (Admin 조회 시)
        if (inquiry.contact_phone) {
            inquiry.contact_phone = decrypt(inquiry.contact_phone);
        }
        if (inquiry.contact_email) {
            inquiry.contact_email = decrypt(inquiry.contact_email);
        }

        res.status(200).send(inquiry);
    } catch (err) {
        console.error('DB Error (Sales Lead View):', err);
        res.status(500).send({ error: 'Database error' });
    }
});

// 3. Update Inquiry Status (Admin only - requires API key)
// Status flow: open → referenced → used_for_order → archived
// 3. Update Sales Lead Status (Admin only - requires API key)
// Status flow: new → contacted → qualified → converted
app.patch('/api/inquiry/:inquiryId/status', requireAdminKey, async (req, res) => {
    const { inquiryId } = req.params;
    const { status, note } = req.body;

    const validStatuses = ['new', 'contacted', 'qualified', 'converted', 'archived'];
    if (!status || !validStatuses.includes(status)) {
        return res.status(400).send({ 
            error: 'Invalid status',
            valid_statuses: validStatuses
        });
    }

    try {
        const adminReply = note || null;
        const [result] = await pool.execute(
            `UPDATE inquiry SET status = ?, admin_reply = COALESCE(?, admin_reply), 
             replied_at = CASE WHEN ? IS NOT NULL THEN CURRENT_TIMESTAMP ELSE replied_at END
             WHERE inquiry_id = ?`,
            [status, adminReply, adminReply, inquiryId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).send({ error: 'Sales Lead not found' });
        }

        console.log(`[Sales Lead] Status updated: ${inquiryId} → ${status}`);
        res.status(200).send({ success: true, status });
    } catch (err) {
        console.error('DB Error (Sales Lead Status):', err);
        res.status(500).send({ error: 'Database error' });
    }
});

// ❌ REMOVED: Session-based inquiry list
// Inquiry is NOT a browsable object. It's a reference captured at a specific context.
// If listing is needed for admin, implement separately with authentication.

// =========================================================
// SimulationAccess API
// =========================================================

// Report ID 생성
function generateReportId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `RPT-${timestamp}-${random}`.toUpperCase();
}

// 1. 시뮬레이션 접근 권한 부여
app.post('/api/simulation-access', async (req, res) => {
    const { sim_id, user_id, source } = req.body;

    if (!sim_id || !user_id) {
        return res.status(400).send({ 
            error: 'Required fields: sim_id, user_id' 
        });
    }

    const validSources = ['login', 'manual_save', 'share'];
    const accessSource = validSources.includes(source) ? source : 'login';

    try {
        // 중복 체크 후 삽입 (ON DUPLICATE KEY UPDATE)
        await pool.execute(
            `INSERT INTO simulation_access (sim_id, user_id, source) 
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE granted_at = CURRENT_TIMESTAMP, source = ?`,
            [sim_id, user_id, accessSource, accessSource]
        );

        console.log(`[SimulationAccess] Granted: sim_id=${sim_id}, user_id=${user_id}, source=${accessSource}`);
        res.status(201).send({ success: true, sim_id, user_id, source: accessSource });
    } catch (err) {
        console.error('DB Error (SimulationAccess):', err);
        res.status(500).send({ error: 'Database error' });
    }
});

// 2. 사용자가 접근 가능한 시뮬레이션 목록
app.get('/api/user/:userId/simulations', async (req, res) => {
    const { userId } = req.params;

    try {
        const [rows] = await pool.execute(
            `SELECT s.id, s.sim_uuid, s.input_data, s.result_data, s.created_at,
                    sa.granted_at, sa.source
             FROM simulation_access sa
             JOIN simulation s ON sa.sim_id = s.id
             WHERE sa.user_id = ?
             ORDER BY sa.granted_at DESC`,
            [userId]
        );

        // JSON 파싱
        const simulations = rows.map(row => ({
            ...row,
            input_data: typeof row.input_data === 'string' ? JSON.parse(row.input_data) : row.input_data,
            result_data: typeof row.result_data === 'string' ? JSON.parse(row.result_data) : row.result_data
        }));

        res.status(200).send({ simulations, count: simulations.length });
    } catch (err) {
        console.error('DB Error (User Simulations):', err);
        res.status(500).send({ error: 'Database error' });
    }
});

// =========================================================
// InsightReport API
// =========================================================

// 1. Insight Report 생성
app.post('/api/insight-report', async (req, res) => {
    const { user_id, sim_id, title, snapshot } = req.body;

    if (!user_id || !sim_id || !snapshot) {
        return res.status(400).send({ 
            error: 'Required fields: user_id, sim_id, snapshot' 
        });
    }

    try {
        // 사용자가 해당 시뮬레이션에 접근 권한이 있는지 확인
        const [accessRows] = await pool.execute(
            'SELECT id FROM simulation_access WHERE user_id = ? AND sim_id = ?',
            [user_id, sim_id]
        );

        if (accessRows.length === 0) {
            return res.status(403).send({ 
                error: 'Access denied',
                hint: 'User does not have access to this simulation'
            });
        }

        const reportId = generateReportId();
        const snapshotStr = typeof snapshot === 'object' ? JSON.stringify(snapshot) : snapshot;

        await pool.execute(
            `INSERT INTO insight_report (report_id, user_id, sim_id, title, snapshot)
             VALUES (?, ?, ?, ?, ?)`,
            [reportId, user_id, sim_id, title || null, snapshotStr]
        );

        console.log(`[InsightReport] Created: ${reportId} for user_id=${user_id}`);
        res.status(201).send({ 
            success: true, 
            report_id: reportId,
            message: 'Insight Report created successfully'
        });
    } catch (err) {
        console.error('DB Error (InsightReport Create):', err);
        res.status(500).send({ error: 'Database error' });
    }
});

// 2. Insight Report 조회
app.get('/api/insight-report/:reportId', async (req, res) => {
    const { reportId } = req.params;

    try {
        const [rows] = await pool.execute(
            `SELECT ir.*, s.sim_uuid, s.input_data as sim_input, s.result_data as sim_result
             FROM insight_report ir
             JOIN simulation s ON ir.sim_id = s.id
             WHERE ir.report_id = ?`,
            [reportId]
        );

        if (rows.length === 0) {
            return res.status(404).send({ error: 'Report not found' });
        }

        const report = rows[0];
        
        // JSON 파싱
        if (typeof report.snapshot === 'string') {
            try { report.snapshot = JSON.parse(report.snapshot); } catch (e) {}
        }
        if (typeof report.sim_input === 'string') {
            try { report.sim_input = JSON.parse(report.sim_input); } catch (e) {}
        }
        if (typeof report.sim_result === 'string') {
            try { report.sim_result = JSON.parse(report.sim_result); } catch (e) {}
        }

        res.status(200).send(report);
    } catch (err) {
        console.error('DB Error (InsightReport Get):', err);
        res.status(500).send({ error: 'Database error' });
    }
});

// 3. 사용자의 Insight Report 목록
app.get('/api/user/:userId/reports', async (req, res) => {
    const { userId } = req.params;

    try {
        const [rows] = await pool.execute(
            `SELECT ir.report_id, ir.title, ir.generated_at, ir.updated_at,
                    s.sim_uuid
             FROM insight_report ir
             JOIN simulation s ON ir.sim_id = s.id
             WHERE ir.user_id = ?
             ORDER BY ir.generated_at DESC`,
            [userId]
        );

        res.status(200).send({ reports: rows, count: rows.length });
    } catch (err) {
        console.error('DB Error (User Reports):', err);
        res.status(500).send({ error: 'Database error' });
    }
});

// =========================================================
// Order API
// =========================================================

// Order ID 생성
function generateOrderId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `ORD-${timestamp}-${random}`.toUpperCase();
}

// 1. Order 생성 (User용 - 비활성화, 미래 Phase용 유지)
// ⚠️ Phase 정책: Admin만 Order 생성 가능
app.post('/api/order', async (req, res) => {
    // 현재 Phase에서는 User의 Order 생성 불가
    return res.status(403).send({ 
        error: 'Order creation is restricted',
        message: 'Orders can only be created by Admin. Contact support for assistance.',
        hint: 'This endpoint will be enabled in a future phase.'
    });
});

// 1-1. Admin용 Order 생성 (신규)
app.post('/api/admin/order', requireAdminKey, async (req, res) => {
    const { inquiry_id, report_id, memo, amount } = req.body;

    // inquiry_id 또는 report_id 중 하나 필수
    if (!inquiry_id && !report_id) {
        return res.status(400).send({ 
            error: 'Either inquiry_id or report_id is required' 
        });
    }

    try {
        // 중복 Order 방지: inquiry_id로 이미 Order가 있는지 확인
        if (inquiry_id) {
            const [existing] = await pool.execute(
                'SELECT order_id FROM `order` WHERE inquiry_id = ?',
                [inquiry_id]
            );
            if (existing.length > 0) {
                return res.status(409).send({ 
                    error: 'Order already exists for this inquiry',
                    existing_order_id: existing[0].order_id
                });
            }

            // Inquiry 존재 여부 확인 (inquiry_id는 VARCHAR, 예: "INQ-XXXXXX")
            const [inqRows] = await pool.execute(
                'SELECT id, inquiry_id, status FROM inquiry WHERE inquiry_id = ?',
                [inquiry_id]
            );
            if (inqRows.length === 0) {
                return res.status(400).send({ error: 'Inquiry not found' });
            }
        }

        // Order 생성
        const orderId = generateOrderId();
        
        await pool.execute(
            `INSERT INTO \`order\` (order_id, inquiry_id, report_id, memo, status, amount)
             VALUES (?, ?, ?, ?, 'DRAFT', ?)`,
            [orderId, inquiry_id || null, report_id || null, memo || null, amount || 0]
        );

        // Inquiry 상태를 'converted'로 전환
        if (inquiry_id) {
            await pool.execute(
                "UPDATE inquiry SET status = 'converted' WHERE inquiry_id = ?",
                [inquiry_id]
            );
        }

        console.log(`[Admin Order] Created: ${orderId} (inquiry_id=${inquiry_id || 'N/A'})`);
        res.status(201).send({ 
            success: true, 
            order_id: orderId,
            status: 'DRAFT'
        });
    } catch (err) {
        console.error('DB Error (Admin Order Create):', err);
        res.status(500).send({ error: 'Database error' });
    }
});

// 2. Order 조회
app.get('/api/order/:orderId', async (req, res) => {
    const { orderId } = req.params;

    try {
        const [rows] = await pool.execute(
            `SELECT * FROM \`order\` WHERE order_id = ?`,
            [orderId]
        );

        if (rows.length === 0) {
            return res.status(404).send({ error: 'Order not found' });
        }

        const order = rows[0];
        
        // JSON 파싱
        if (typeof order.sim_snapshot === 'string') {
            try { order.sim_snapshot = JSON.parse(order.sim_snapshot); } catch (e) {}
        }

        res.status(200).send(order);
    } catch (err) {
        console.error('DB Error (Order Get):', err);
        res.status(500).send({ error: 'Database error' });
    }
});

// 3. Order 상태 업데이트 (Admin only)
app.patch('/api/order/:orderId/status', requireAdminKey, async (req, res) => {
    const { orderId } = req.params;
    const { status, runcomm_ref, note } = req.body;

    const validStatuses = ['DRAFT', 'CONFIRMED', 'ORDERED', 'RUNNING', 'DONE', 'CANCELLED'];
    if (!status || !validStatuses.includes(status)) {
        return res.status(400).send({ 
            error: 'Invalid status',
            valid_statuses: validStatuses
        });
    }

    try {
        // runcomm_ref가 있으면 runcomm_sent_at도 업데이트
        let query, params;
        if (runcomm_ref) {
            query = `UPDATE \`order\` SET status = ?, runcomm_ref = ?, runcomm_sent_at = CURRENT_TIMESTAMP, 
                     note = COALESCE(?, note) WHERE order_id = ?`;
            params = [status, runcomm_ref, note, orderId];
        } else {
            query = `UPDATE \`order\` SET status = ?, note = COALESCE(?, note) WHERE order_id = ?`;
            params = [status, note, orderId];
        }

        const [result] = await pool.execute(query, params);

        if (result.affectedRows === 0) {
            return res.status(404).send({ error: 'Order not found' });
        }

        console.log(`[Order] Status updated: ${orderId} → ${status}`);
        res.status(200).send({ success: true, status });
    } catch (err) {
        console.error('DB Error (Order Status):', err);
        res.status(500).send({ error: 'Database error' });
    }
});

// 4. 사용자의 Order 목록
app.get('/api/user/:userId/orders', async (req, res) => {
    const { userId } = req.params;

    try {
        const [rows] = await pool.execute(
            `SELECT order_id, amount, status, runcomm_ref, created_at, updated_at
             FROM \`order\` WHERE user_id = ?
             ORDER BY created_at DESC`,
            [userId]
        );

        res.status(200).send({ orders: rows, count: rows.length });
    } catch (err) {
        console.error('DB Error (User Orders):', err);
        res.status(500).send({ error: 'Database error' });
    }
});

// =========================================================
// Admin API
// =========================================================

// 1. Inquiry 리스트 (Admin only)
app.get('/api/admin/inquiries', requireAdminKey, async (req, res) => {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    try {
        // 총 개수 조회
        let countQuery = 'SELECT COUNT(*) as total FROM inquiry';
        let countParams = [];
        if (status) {
            countQuery += ' WHERE status = ?';
            countParams.push(status);
        }
        const [[{ total }]] = await pool.execute(countQuery, countParams);

        // 리스트 조회
        let query = `SELECT inquiry_id, session_id, sim_uuid, 
                            contact_phone, contact_email, status, 
                            created_at, updated_at
                     FROM inquiry`;
        let params = [];
        if (status) {
            query += ' WHERE status = ?';
            params.push(status);
        }
        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);

        const [rows] = await pool.execute(query, params);

        // contact 정보 복호화
        const inquiries = rows.map(row => ({
            ...row,
            contact_phone: row.contact_phone ? decrypt(row.contact_phone) : null,
            contact_email: row.contact_email ? decrypt(row.contact_email) : null
        }));

        res.status(200).send({
            inquiries,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (err) {
        console.error('DB Error (Admin Inquiries):', err);
        res.status(500).send({ error: 'Database error' });
    }
});

// 2. Order 리스트 (Admin only)
app.get('/api/admin/orders', requireAdminKey, async (req, res) => {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    try {
        // 총 개수 조회
        let countQuery = 'SELECT COUNT(*) as total FROM `order`';
        let countParams = [];
        if (status) {
            countQuery += ' WHERE status = ?';
            countParams.push(status);
        }
        const [[{ total }]] = await pool.execute(countQuery, countParams);

        // 리스트 조회
        let query = `SELECT o.order_id, o.user_id, o.amount, o.status, 
                            o.runcomm_ref, o.runcomm_sent_at, o.created_at,
                            u.email as user_email, u.name as user_name
                     FROM \`order\` o
                     LEFT JOIN user u ON o.user_id = u.id`;
        let params = [];
        if (status) {
            query += ' WHERE o.status = ?';
            params.push(status);
        }
        query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);

        const [rows] = await pool.execute(query, params);

        res.status(200).send({
            orders: rows,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (err) {
        console.error('DB Error (Admin Orders):', err);
        res.status(500).send({ error: 'Database error' });
    }
});

// 3. Admin 대시보드 통계
app.get('/api/admin/stats', requireAdminKey, async (req, res) => {
    try {
        // Inquiry 통계
        const [[inquiryStats]] = await pool.execute(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as new_count,
                SUM(CASE WHEN status = 'contacted' THEN 1 ELSE 0 END) as contacted_count,
                SUM(CASE WHEN status = 'qualified' THEN 1 ELSE 0 END) as qualified_count,
                SUM(CASE WHEN status = 'converted' THEN 1 ELSE 0 END) as converted_count
            FROM inquiry
        `);

        // Order 통계
        const [[orderStats]] = await pool.execute(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'ORDERED' THEN 1 ELSE 0 END) as ordered_count,
                SUM(CASE WHEN status = 'RUNNING' THEN 1 ELSE 0 END) as running_count,
                SUM(CASE WHEN status = 'DONE' THEN 1 ELSE 0 END) as done_count,
                SUM(amount) as total_amount,
                SUM(CASE WHEN status = 'DONE' THEN amount ELSE 0 END) as completed_amount
            FROM \`order\`
        `);

        // 오늘 통계
        const [[todayStats]] = await pool.execute(`
            SELECT 
                (SELECT COUNT(*) FROM inquiry WHERE DATE(created_at) = CURDATE()) as inquiries_today,
                (SELECT COUNT(*) FROM \`order\` WHERE DATE(created_at) = CURDATE()) as orders_today,
                (SELECT COUNT(*) FROM simulation WHERE DATE(created_at) = CURDATE()) as simulations_today,
                (SELECT COUNT(*) FROM session WHERE DATE(created_at) = CURDATE()) as sessions_today
        `);

        res.status(200).send({
            inquiry: inquiryStats,
            order: orderStats,
            today: todayStats
        });
    } catch (err) {
        console.error('DB Error (Admin Stats):', err);
        res.status(500).send({ error: 'Database error' });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    // Check DB Connection on Start
    pool.getConnection()
        .then(conn => {
            console.log('Database connected successfully');
            conn.release();
        })
        .catch(err => {
            console.error('Failed to connect to DB:', err.message);
        });
});
