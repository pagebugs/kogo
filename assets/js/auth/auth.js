/**
 * Auth API Module
 * 회원가입, 로그인, 세션 관리 클라이언트 API
 */

const AuthAPI = (function() {
    'use strict';

    const API_BASE = 'http://localhost:3000';

    // =========================================================
    // 공통 fetch 래퍼
    // =========================================================
    async function apiCall(method, endpoint, body = null) {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        try {
            const res = await fetch(`${API_BASE}${endpoint}`, options);
            const data = await res.json();
            
            if (!res.ok) {
                throw new Error(data.error || `HTTP ${res.status}`);
            }

            return data;
        } catch (err) {
            console.error(`[AuthAPI] ${method} ${endpoint} 실패:`, err);
            throw err;
        }
    }

    // =========================================================
    // 회원가입
    // =========================================================
    async function signup(userData) {
        /**
         * userData 구조:
         * {
         *   email: string (필수),
         *   password: string (필수),
         *   name: string (필수),
         *   phone: string (필수),
         *   company: string (선택),
         *   position: string (선택),
         *   memberType: 'GENERAL' | 'COOP_MEMBER' | 'COOP_ASSOCIATE' | 'PARTNER' (기본: GENERAL),
         *   organizationId: number (조합원의 경우),
         *   businessNumber: string (파트너의 경우)
         * }
         */
        return apiCall('POST', '/api/auth/signup', {
            email: userData.email,
            password: userData.password,
            name: userData.name,
            phone: userData.phone,
            company: userData.company || null,
            position: userData.position || null,
            member_type: userData.memberType || 'GENERAL',
            organization_id: userData.organizationId || null,
            business_number: userData.businessNumber || null
        });
    }

    // =========================================================
    // 로그인
    // =========================================================
    async function login(email, password) {
        const result = await apiCall('POST', '/api/auth/login', { email, password });
        
        if (result.success && result.user) {
            // 로컬 스토리지에 사용자 정보 저장
            localStorage.setItem('kogo_user', JSON.stringify(result.user));
            localStorage.setItem('kogo_token', result.token || '');
        }
        
        return result;
    }

    // =========================================================
    // 로그아웃
    // =========================================================
    async function logout() {
        try {
            await apiCall('POST', '/api/auth/logout');
        } catch (err) {
            console.warn('Logout API failed, clearing local session anyway.');
        }
        
        localStorage.removeItem('kogo_user');
        localStorage.removeItem('kogo_token');
        
        return { success: true };
    }

    // =========================================================
    // 현재 사용자 조회
    // =========================================================
    function getCurrentUser() {
        const userStr = localStorage.getItem('kogo_user');
        return userStr ? JSON.parse(userStr) : null;
    }

    // =========================================================
    // 로그인 상태 확인
    // =========================================================
    function isLoggedIn() {
        return !!getCurrentUser();
    }

    // =========================================================
    // 이메일 중복 확인
    // =========================================================
    async function checkEmailExists(email) {
        return apiCall('GET', `/api/auth/check-email?email=${encodeURIComponent(email)}`);
    }

    // =========================================================
    // 조직 목록 조회 (회원가입 시 조합 선택용)
    // =========================================================
    async function getOrganizations(orgType = null) {
        let endpoint = '/api/organizations';
        if (orgType) {
            endpoint += `?org_type=${encodeURIComponent(orgType)}`;
        }
        return apiCall('GET', endpoint);
    }

    // Public API
    return {
        signup,
        login,
        logout,
        getCurrentUser,
        isLoggedIn,
        checkEmailExists,
        getOrganizations
    };
})();
