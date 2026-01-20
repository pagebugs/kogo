const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bodyParser = require('body-parser');

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
    const { session_id, sim_uuid, contact, interest_tags, context_snapshot } = req.body;

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

        await pool.execute(
            `INSERT INTO inquiry 
            (inquiry_id, session_id, sim_uuid, contact_phone, contact_email, interest_tags, context_snapshot, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, 'new')`,
            [inquiryId, session_id, sim_uuid || null, phone, email, interestJson, contextStr]
        );

        console.log(`[Sales Lead] Created: ${inquiryId} (Phone: ${phone}, Email: ${email})`);
        
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
