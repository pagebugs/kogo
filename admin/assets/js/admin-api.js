/**
 * Admin API 공통 모듈
 * ⚠️ Phase 1 의도된 설계: Admin Key 기반 접근 제한
 * 
 * 사용법:
 *   AdminAPI.inquiries.list({ status: 'new' })
 *   AdminAPI.inquiries.view('inq_123')
 *   AdminAPI.orders.list()
 */

const AdminAPI = (function() {
    'use strict';

    // =========================================================
    // 설정
    // =========================================================
    const API_BASE = 'http://localhost:3000';
    
    // ⚠️ 실제 운영 시 환경변수 또는 보안 저장소에서 로드 필요
    // 현재는 개발/테스트 환경용 하드코딩
    const ADMIN_API_KEY = 'dev_admin_key_change_in_prod';

    // =========================================================
    // 공통 fetch 래퍼
    // =========================================================
    async function apiCall(method, endpoint, body = null) {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'X-Admin-Api-Key': ADMIN_API_KEY
            }
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        try {
            const res = await fetch(`${API_BASE}${endpoint}`, options);
            
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${res.status}`);
            }

            return await res.json();
        } catch (err) {
            console.error(`[AdminAPI] ${method} ${endpoint} 실패:`, err);
            throw err;
        }
    }

    // =========================================================
    // Inquiry API
    // =========================================================
    const inquiries = {
        /**
         * Inquiry 리스트 조회
         * @param {Object} filters - { status, source_type, source_page, page, limit }
         */
        async list(filters = {}) {
            const params = new URLSearchParams();
            if (filters.status) params.append('status', filters.status);
            if (filters.source_type) params.append('source_type', filters.source_type);
            if (filters.source_page) params.append('source_page', filters.source_page);
            if (filters.page) params.append('page', filters.page);
            if (filters.limit) params.append('limit', filters.limit);

            const queryString = params.toString();
            const endpoint = `/api/admin/inquiries${queryString ? '?' + queryString : ''}`;
            
            return apiCall('GET', endpoint);
        },

        /**
         * Inquiry 상세 조회 (복호화된 연락처 포함)
         * @param {string} inquiryId
         */
        async view(inquiryId) {
            return apiCall('POST', `/api/inquiry/${inquiryId}/view`);
        },

        /**
         * Inquiry 상태 변경
         * @param {string} inquiryId
         * @param {string} status - new, contacted, qualified, converted, archived
         * @param {string} note - 관리자 메모 (선택)
         */
        async updateStatus(inquiryId, status, note = null) {
            return apiCall('PATCH', `/api/inquiry/${inquiryId}/status`, { status, note });
        }
    };

    // =========================================================
    // Order API
    // =========================================================
    const orders = {
        /**
         * Order 리스트 조회
         * @param {Object} filters - { status, page, limit }
         */
        async list(filters = {}) {
            const params = new URLSearchParams();
            if (filters.status) params.append('status', filters.status);
            if (filters.page) params.append('page', filters.page);
            if (filters.limit) params.append('limit', filters.limit);

            const queryString = params.toString();
            const endpoint = `/api/admin/orders${queryString ? '?' + queryString : ''}`;
            
            return apiCall('GET', endpoint);
        },

        /**
         * Admin Order 생성 (Inquiry 기반)
         * @param {string} inquiryId
         * @param {string} memo - 관리자 메모
         */
        async create(inquiryId, memo = '') {
            return apiCall('POST', '/api/admin/order', { inquiry_id: inquiryId, memo });
        },

        /**
         * Order 상태 변경
         * @param {string} orderId
         * @param {string} status - DRAFT, CONFIRMED, ORDERED, RUNNING, DONE, CANCELLED
         */
        async updateStatus(orderId, status) {
            return apiCall('PATCH', `/api/order/${orderId}/status`, { status });
        }
    };

    // =========================================================
    // Stats API (Dashboard용)
    // =========================================================
    const stats = {
        /**
         * Admin 대시보드 통계 조회
         */
        async get() {
            return apiCall('GET', '/api/admin/stats');
        },

        /**
         * 관심도(Engagement) 통계 조회
         * - 세션당 평균 시뮬레이션 횟수
         * - 높은 관심도 세션 수 (2회 이상)
         */
        async getEngagement() {
            return apiCall('GET', '/api/admin/stats/engagement');
        }
    };

    // =========================================================
    // User (Member) API
    // =========================================================
    const users = {
        /**
         * 회원 리스트 조회
         * @param {Object} filters - { member_type, status, organization_id, page, limit }
         */
        async list(filters = {}) {
            const params = new URLSearchParams();
            if (filters.member_type) params.append('member_type', filters.member_type);
            if (filters.status) params.append('status', filters.status);
            if (filters.organization_id) params.append('organization_id', filters.organization_id);
            if (filters.page) params.append('page', filters.page);
            if (filters.limit) params.append('limit', filters.limit);

            const queryString = params.toString();
            const endpoint = `/api/admin/users${queryString ? '?' + queryString : ''}`;
            
            return apiCall('GET', endpoint);
        },

        /**
         * 회원 상세 조회
         * @param {number} userId
         */
        async view(userId) {
            return apiCall('GET', `/api/admin/users/${userId}`);
        },

        /**
         * 회원 정보 업데이트 (유형, 상태, 승인 등)
         * @param {number} userId
         * @param {Object} data
         */
        async update(userId, data) {
            return apiCall('PATCH', `/api/admin/users/${userId}`, data);
        }
    };

    // =========================================================
    // Organization API
    // =========================================================
    const organizations = {
        /**
         * 조직(조합사) 리스트 조회
         * @param {Object} filters - { org_type, status }
         */
        async list(filters = {}) {
            const params = new URLSearchParams();
            if (filters.org_type) params.append('org_type', filters.org_type);
            if (filters.status) params.append('status', filters.status);

            const queryString = params.toString();
            const endpoint = `/api/admin/organizations${queryString ? '?' + queryString : ''}`;
            
            return apiCall('GET', endpoint);
        }
    };

    // =========================================================
    // 유틸리티
    // =========================================================
    const utils = {
        /**
         * 날짜 포맷팅
         */
        formatDate(dateString) {
            if (!dateString) return '-';
            const d = new Date(dateString);
            return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
        },

        /**
         * 숫자 포맷팅 (천 단위 콤마)
         */
        formatNumber(num) {
            if (num === null || num === undefined) return '-';
            return Number(num).toLocaleString();
        },

        /**
         * 상태 배지 HTML 생성
         */
        statusBadge(status) {
            const badges = {
                'new': '<span class="badge badge-new">NEW</span>',
                'contacted': '<span class="badge badge-contacted">CONTACTED</span>',
                'qualified': '<span class="badge badge-qualified">QUALIFIED</span>',
                'converted': '<span class="badge badge-converted">CONVERTED</span>',
                'archived': '<span class="badge badge-archived">ARCHIVED</span>',
                'DRAFT': '<span class="badge badge-draft">DRAFT</span>',
                'CONFIRMED': '<span class="badge badge-confirmed">CONFIRMED</span>',
                'ORDERED': '<span class="badge badge-ordered">ORDERED</span>',
                'RUNNING': '<span class="badge badge-running">RUNNING</span>',
                'DONE': '<span class="badge badge-done">DONE</span>',
                'CANCELLED': '<span class="badge badge-cancelled">CANCELLED</span>',
                // 회원 유형 배지
                'ADMIN': '<span class="badge badge-admin">ADMIN</span>',
                'COOP_MEMBER': '<span class="badge badge-coop">조합회원</span>',
                'COOP_ASSOCIATE': '<span class="badge badge-coop-sub">준회원</span>',
                'PARTNER': '<span class="badge badge-partner">PARTNER</span>',
                'GENERAL': '<span class="badge badge-general">일반</span>'
            };
            return badges[status] || `<span class="badge">${status}</span>`;
        }
    };

    // Public API
    return {
        inquiries,
        orders,
        users,
        organizations,
        stats,
        utils
    };
})();

// 전역 노출
window.AdminAPI = AdminAPI;
