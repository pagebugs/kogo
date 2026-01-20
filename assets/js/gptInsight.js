// =========================================================
// GPT INSIGHT MODULE
// Generates AI-based interpretation of Runcomm data
// =========================================================

/**
 * System Prompt for TouchAd BI Interpretation AI
 * This prompt is fixed and should not be modified.
 */
const GPT_SYSTEM_PROMPT = `너는 터치애드 BI 해석 전용 AI다.
너의 역할은 다음으로 한정된다:
- Runcomm 데이터 기반 결과의 '페이지 전체 해석 톤'을 생성
- 과장·허위·단정적 표현 금지
- 의료 마케팅 및 의료법 맥락 유지
- 숫자의 절대값보다 맥락·비교·집중도를 중심으로 해석
- 결론이 아닌 '상황 요약 + 방향성 제안' 수준으로 표현

출력 형식:
- 2~3문장 분량의 해석 메시지
- UI에 그대로 출력 가능한 자연스러운 텍스트
- 마크다운이나 특수 포맷 없이 순수 텍스트만 출력`;

/**
 * Default fallback message when GPT API fails
 */
const GPT_FALLBACK_MESSAGE = "현재 AI 분석을 사용할 수 없습니다. 위 차트와 데이터를 참고하여 시장 현황을 파악해 주세요.";

/**
 * Generate AI insight from Runcomm data
 * @param {Object} params - Input parameters
 * @param {Array} params.resData - Runcomm API response data
 * @param {Array} params.dunjugoValues - Extracted dunjugo values
 * @param {Object} params.filters - Applied filters (gender, age, radius)
 * @returns {Promise<string>} AI interpretation message
 */
async function generateGptInsight({ resData, dunjugoValues, filters }) {
  // Check if TOUCH_CONFIG is available
  if (typeof TOUCH_CONFIG === 'undefined' || !TOUCH_CONFIG.OPENAI_API_KEY) {
    console.warn('[GPT Insight] API Key not configured, using fallback');
    return GPT_FALLBACK_MESSAGE;
  }

  // Prepare user prompt with data
  const totalUsers = dunjugoValues[0]?.value || 0;
  const ageUsers = dunjugoValues[1]?.value || 0;
  const genderUsers = dunjugoValues[2]?.value || 0;

  const agePct = totalUsers > 0 ? ((ageUsers / totalUsers) * 100).toFixed(1) : 0;
  const genderPct = totalUsers > 0 ? ((genderUsers / totalUsers) * 100).toFixed(1) : 0;

  const userPrompt = `다음은 병원 주변 잠재 환자 분석 결과입니다:

- 분석 반경 내 잠재 환자 수: ${totalUsers.toLocaleString()}명
- 30대 타겟층 비중: ${agePct}% (${ageUsers.toLocaleString()}명)
- 여성 고객 비중: ${genderPct}% (${genderUsers.toLocaleString()}명)
- 적용 필터: ${filters?.gender || '전체'} / ${filters?.age || '전체'} / ${filters?.radius || '1km'}

이 데이터를 바탕으로 간결한 시장 해석 메시지를 생성해 주세요.`;

  try {
    console.log('[GPT Insight] Calling OpenAI API...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOUCH_CONFIG.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: TOUCH_CONFIG.GPT_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: GPT_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: TOUCH_CONFIG.GPT_MAX_TOKENS || 300,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[GPT Insight] API Error:', response.status, errorData);
      return GPT_FALLBACK_MESSAGE;
    }

    const data = await response.json();
    const insightMessage = data.choices?.[0]?.message?.content?.trim();

    if (!insightMessage) {
      console.warn('[GPT Insight] Empty response from API');
      return GPT_FALLBACK_MESSAGE;
    }

    console.log('[GPT Insight] Successfully generated insight');
    return insightMessage;

  } catch (error) {
    console.error('[GPT Insight] Request failed:', error);
    return GPT_FALLBACK_MESSAGE;
  }
}

// Export for module usage (if needed)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { generateGptInsight, GPT_FALLBACK_MESSAGE };
}
