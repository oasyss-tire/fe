export const sendContractEmail = async (contractId, participants) => {
  try {
    const emailParticipants = participants.filter(p => p.notifyType === 'EMAIL');
    let emailCount = 0;
    const baseUrl = window.location.origin;
    
    for (const participant of emailParticipants) {
      // 새로운 API 호출 방식으로 변경
      const emailResponse = await fetch('https://sign.jebee.net/api/email/send-signature-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: new URLSearchParams({
          participantId: participant.id,
          to: participant.email,
          name: participant.name,
          contractTitle: participant.contract?.title || '계약서 서명',
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