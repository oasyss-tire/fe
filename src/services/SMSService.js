export const sendContractSMS = async (contractId, participants) => {
  try {
    const smsParticipants = participants.filter(p => p.notifyType === 'SMS');
    
    for (const participant of smsParticipants) {
      const signaturePath = `${contractId}/participant/${participant.id}`;
      
      const smsResponse = await fetch('http://localhost:8080/api/sms/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          name: participant.name,
          phone: participant.phoneNumber,
          content: '',
          link: signaturePath
        })
      });

      if (!smsResponse.ok) {
        throw new Error(`SMS 발송 실패 - ${participant.phoneNumber}`);
      }
    }
    return { success: true, smsCount: smsParticipants.length };
  } catch (error) {
    console.error('SMS 발송 중 오류:', error);
    return { success: false, error: error.message };
  }
}; 