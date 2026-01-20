const http = require('http');

const API_BASE = 'http://localhost:3000';
const ADMIN_API_KEY = 'dev_admin_key_change_in_prod';

// Simple fetch polyfill using http module
function fetchHelper(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const body = options.body;
    
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    if (body) {
      reqOptions.headers['Content-Length'] = Buffer.byteLength(body);
    }

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          json: () => {
            try {
              return Promise.resolve(JSON.parse(data));
            } catch (e) {
              return Promise.resolve(data); // Return text if not JSON
            }
          }
        });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(body);
    }
    req.end();
  });
}

async function testSalesLeadFlow() {
  try {
    console.log('--- Starting Sales Lead API Verification (Node < 18 compat) ---');

    // 1. Create Session
    console.log('\n[1] Creating Session...');
    const sessionRes = await fetchHelper(`${API_BASE}/api/session`, { method: 'POST' });
    const sessionData = await sessionRes.json();
    if (!sessionData.session_id) throw new Error('Failed to create session');
    console.log('Session ID:', sessionData.session_id);

    // 2. Create Sales Lead (Inquiry)
    console.log('\n[2] Creating Sales Lead...');
    const payload = {
      session_id: sessionData.session_id,
      contact: {
        phone: '010-1234-5678',
        email: 'test@example.com'
      },
      interest_tags: ['execution_feasibility', 'custom_strategy'],
      context_snapshot: {
        source_page: 'test_script',
        resData_snapshot: { total: 5000 }
      }
    };

    const createRes = await fetchHelper(`${API_BASE}/api/inquiry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const createData = await createRes.json();
    if (!createRes.ok) throw new Error(`Create failed: ${JSON.stringify(createData)}`);
    console.log('Sales Lead Created:', createData);
    const inquiryId = createData.inquiry_id;

    // 3. View Sales Lead (Admin Only)
    console.log('\n[3] Viewing Sales Lead (Admin Key)...');
    const viewRes = await fetchHelper(`${API_BASE}/api/inquiry/${inquiryId}/view`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-admin-api-key': ADMIN_API_KEY 
      }
    });
    
    const viewData = await viewRes.json();
    if (!viewRes.ok) throw new Error(`View failed: ${JSON.stringify(viewData)}`);
    console.log('Sales Lead Data:', {
      id: viewData.inquiry_id,
      contact_phone: viewData.contact_phone,
      interest_tags: viewData.interest_tags
    });

    if (viewData.contact_phone !== '010-1234-5678') throw new Error('Phone mismatch');
    if (typeof viewData.interest_tags === 'string') viewData.interest_tags = JSON.parse(viewData.interest_tags);
    if (!viewData.interest_tags.includes('custom_strategy')) throw new Error('Tags mismatch');

    // 4. Update Status
    console.log('\n[4] Updating Status to "contacted"...');
    const statusRes = await fetchHelper(`${API_BASE}/api/inquiry/${inquiryId}/status`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'x-admin-api-key': ADMIN_API_KEY 
      },
      body: JSON.stringify({ status: 'contacted', note: 'Called by test script' })
    });

    const statusData = await statusRes.json();
    if (!statusRes.ok) throw new Error(`Status update failed: ${JSON.stringify(statusData)}`);
    console.log('Status Updated:', statusData);

    console.log('\n✅ Sales Lead Flow Verified Successfully!');

  } catch (err) {
    console.error('\n❌ Verification Failed:', err);
    process.exit(1);
  }
}

testSalesLeadFlow();
