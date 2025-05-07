export const sendContractEmail = async (contractId, participants, contractTitle = '계약서 서명') => {
  try {
    const emailParticipants = participants.filter(p => p.notifyType === 'EMAIL');
    let emailCount = 0;
    const baseUrl = window.location.origin;
    
    for (const participant of emailParticipants) {
      // 새로운 API 호출 방식으로 변경
      const emailResponse = await fetch('http://localhost:8080/api/email/send-signature-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: new URLSearchParams({
          participantId: participant.id,
          to: participant.email,
          name: participant.name,
          // 계약 제목 우선순위: participant.contract?.title > 함수에 전달된 contractTitle > 기본값
          contractTitle: participant.contract?.title || contractTitle || '계약서 서명',
          baseUrl: baseUrl
        })
      });

      if (!emailResponse.ok) {
        throw new Error(`이메일 발송 실패 - ${participant.email}`);
      }
      
      emailCount++;
    }
    return { success: true, emailCount: emailCount };
  } catch (error) {
    console.error('이메일 발송 중 오류:', error);
    return { success: false, error: error.message };
  }
}; 