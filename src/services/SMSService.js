export const sendContractSMS = async (contractId, participants, contractInfo) => {
  try {
    // KAKAO 타입으로 설정된 참여자만 필터링
    const kakaoParticipants = participants.filter(p => p.notifyType === 'KAKAO');
    let successCount = 0;
    
    console.log('알림톡 대상자 수:', kakaoParticipants.length, '명');
    
    for (const participant of kakaoParticipants) {
      try {
        // 1. 먼저 토큰 발급 API 호출
        console.log('토큰 발급 요청 - 참여자 ID:', participant.id);
        const tokenResponse = await fetch('https://sign.jebee.net/api/kakao-alert/generate-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`
          },
          body: JSON.stringify({
            participantId: participant.id
          })
        });
        
        if (!tokenResponse.ok) {
          const errorText = await tokenResponse.text();
          console.error('토큰 발급 실패:', errorText);
          throw new Error(`토큰 발급 실패 - ${participant.phoneNumber}`);
        }
        
        // 2. 토큰 발급 결과 확인
        const tokenData = await tokenResponse.json();
        console.log('토큰 발급 성공:', tokenData);
        
        if (!tokenData.token) {
          throw new Error('토큰이 생성되지 않았습니다.');
        }
        
        // 3. 현재 날짜를 YYYY-MM-DD 형식으로 변환
        const today = new Date();
        const contractDate = today.toISOString().split('T')[0];
        
        // 4. 토큰을 포함한 URL 생성
        const signatureUrl = `tirebank.jebee.net/contract-sign?token=${tokenData.token}`;
        
        // 5. 알림톡 요청 데이터 생성
        const kakaoAlertData = {
          phoneNumber: participant.phoneNumber,
          name: participant.name,
          title: contractInfo?.title || '계약서 서명 요청',
          requester: contractInfo?.createdBy || '관리자',
          contractDate: contractDate,
          url: signatureUrl  // 토큰이 포함된 URL
        };
        
        console.log('알림톡 요청 데이터:', kakaoAlertData);
        
        // 6. 알림톡 API 호출
        const response = await fetch('https://sign.jebee.net/api/kakao-alert/contract-signature', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`
          },
          body: JSON.stringify(kakaoAlertData)
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('알림톡 발송 실패:', errorText);
          throw new Error(`알림톡 발송 실패 - ${participant.phoneNumber}`);
        }
        
        console.log('알림톡 발송 성공:', participant.phoneNumber);
        successCount++;
      } catch (participantError) {
        // 단일 참여자 처리 중 오류가 발생한 경우 기록하고 다음 참여자 계속 처리
        console.error(`참여자 처리 중 오류(${participant.phoneNumber}):`, participantError);
      }
    }
    
    return { success: true, smsCount: successCount };
  } catch (error) {
    console.error('알림톡 발송 중 오류:', error);
    return { success: false, error: error.message };
  }
}; 