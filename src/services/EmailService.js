const EMAIL_TEMPLATE = (participant, signatureLink) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
    <div style="background-color: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <!-- 본문 내용 -->
      <h2 style="color: #1976d2; text-align: center; margin-bottom: 30px; font-size: 24px;">
        계약서 서명 요청
      </h2>
      
      <div style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
        <p style="margin-bottom: 15px;">안녕하세요, ${participant.name}님</p>
        <p style="margin-bottom: 15px;">계약서 서명이 요청되었습니다.</p>
        <p>아래 버튼을 클릭하여 서명을 진행해주세요.</p>
      </div>

      <!-- 버튼 영역 -->
      <div style="text-align: center; margin: 40px 0;">
        <a href="${signatureLink}" 
           style="display: inline-block;
                  background-color: #1976d2;
                  color: white;
                  padding: 15px 40px;
                  text-decoration: none;
                  border-radius: 8px;
                  font-size: 16px;
                  font-weight: 600;">
          서명하기
        </a>
      </div>

      <!-- 주의사항 -->
      <div style="background-color: #f8f9fa; 
                  border-radius: 4px; 
                  padding: 15px; 
                  margin-bottom: 30px;
                  color: #666;
                  font-size: 14px;">
        <p style="margin: 0;">※ 본 링크는 24시간 동안 유효합니다.</p>
        <p style="margin: 5px 0 0 0;">※ 문의사항이 있으시면 아래 연락처로 문의해주세요.</p>
      </div>
    </div>

    <!-- 푸터 영역 -->
    <div style="text-align: center; 
                padding-top: 30px; 
                color: #666; 
                font-size: 13px; 
                border-top: 1px solid #eee;
                margin-top: 30px;">
      <p style="margin: 0;">(주) 타이어 뱅크 | 세종 한누리대로 350 8층 | TEL: 1599-7181</p>
      <p style="margin: 10px 0 0 0; color: #999;">
        본 메일은 발신전용 메일이며, 문의사항은 고객센터를 이용해주세요.
      </p>
    </div>
  </div>
`;

export const sendContractEmail = async (contractId, participants) => {
  try {
    const emailParticipants = participants.filter(p => p.notifyType === 'EMAIL');
    
    for (const participant of emailParticipants) {
      const signatureLink = `${window.location.origin}/contract-sign/${contractId}/participant/${participant.id}`;
      
      const emailResponse = await fetch('http://localhost:8080/api/email/send-html', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          to: participant.email,
          subject: '[타이어뱅크] 계약서 서명 요청',
          content: EMAIL_TEMPLATE(participant, signatureLink)
        })
      });

      if (!emailResponse.ok) {
        throw new Error(`이메일 발송 실패 - ${participant.email}`);
      }
    }
    return { success: true, emailCount: emailParticipants.length };
  } catch (error) {
    console.error('이메일 발송 중 오류:', error);
    return { success: false, error: error.message };
  }
}; 