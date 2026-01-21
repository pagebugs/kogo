/**
 * 암호화 유틸리티 모듈
 * AES-256-CBC 대칭키 암호화 사용
 * 
 * 환경변수:
 * - ENCRYPTION_KEY: 32바이트 암호화 키 (없으면 개발용 기본값 사용)
 */

const crypto = require('crypto');

// 암호화 알고리즘 및 설정
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16; // AES 블록 크기

// 개발 환경용 기본 키 (운영에서는 반드시 환경변수로 설정)
const DEFAULT_DEV_KEY = 'touchad_dev_encryption_key_32b!'; // 32 bytes
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || DEFAULT_DEV_KEY;

// 키가 32바이트인지 확인
if (Buffer.byteLength(ENCRYPTION_KEY, 'utf8') !== 32) {
    console.warn('[Crypto] WARNING: ENCRYPTION_KEY must be exactly 32 bytes. Using padded/truncated key.');
}

// 32바이트로 맞추기 (부족하면 패딩, 초과하면 자르기)
const KEY = Buffer.alloc(32);
Buffer.from(ENCRYPTION_KEY, 'utf8').copy(KEY);

/**
 * 평문을 AES-256-CBC로 암호화
 * @param {string} plainText - 암호화할 평문
 * @returns {string} - IV:암호문 형태의 Base64 인코딩 문자열
 */
function encrypt(plainText) {
    if (!plainText) return null;
    
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
    
    let encrypted = cipher.update(plainText, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    // IV와 암호문을 콜론으로 구분하여 저장
    return iv.toString('base64') + ':' + encrypted;
}

/**
 * AES-256-CBC 암호문을 복호화
 * @param {string} cipherText - IV:암호문 형태의 Base64 인코딩 문자열
 * @returns {string} - 복호화된 평문
 */
function decrypt(cipherText) {
    if (!cipherText) return null;
    
    const parts = cipherText.split(':');
    if (parts.length !== 2) {
        console.warn('[Crypto] Invalid cipher text format');
        return null;
    }
    
    const iv = Buffer.from(parts[0], 'base64');
    const encrypted = parts[1];
    
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
}

/**
 * 암호화 상태 점검 (테스트용)
 */
function testEncryption() {
    const testData = '010-1234-5678';
    const encrypted = encrypt(testData);
    const decrypted = decrypt(encrypted);
    
    console.log('[Crypto Test]');
    console.log('  Original:', testData);
    console.log('  Encrypted:', encrypted);
    console.log('  Decrypted:', decrypted);
    console.log('  Match:', testData === decrypted ? '✅ SUCCESS' : '❌ FAILED');
    
    return testData === decrypted;
}

module.exports = {
    encrypt,
    decrypt,
    testEncryption
};

// 직접 실행 시 테스트
if (require.main === module) {
    testEncryption();
}
