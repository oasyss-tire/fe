import axios from 'axios';

const BASE_URL = '/api/contract-event-logs';

/**
 * 계약 이벤트 로그 서비스
 * 계약 작업에 대한 이벤트 로그를 조회하는 API 호출 서비스
 */
class ContractEventLogService {
  /**
   * 특정 계약의 이벤트 로그 조회
   * @param {number} contractId 계약 ID
   * @returns {Promise} API 응답
   */
  getEventLogsByContract(contractId) {
    return axios.get(`${BASE_URL}/contract/${contractId}`);
  }

  /**
   * 특정 참여자의 이벤트 로그 조회
   * @param {number} participantId 참여자 ID
   * @returns {Promise} API 응답
   */
  getEventLogsByParticipant(participantId) {
    return axios.get(`${BASE_URL}/participant/${participantId}`);
  }

  /**
   * 특정 이벤트 타입의 로그 조회
   * @param {string} eventTypeCodeId 이벤트 타입 코드
   * @returns {Promise} API 응답
   */
  getEventLogsByEventType(eventTypeCodeId) {
    return axios.get(`${BASE_URL}/event-type/${eventTypeCodeId}`);
  }

  /**
   * 기간별 이벤트 로그 조회
   * @param {Date} startDate 시작일
   * @param {Date} endDate 종료일
   * @returns {Promise} API 응답
   */
  getEventLogsByPeriod(startDate, endDate) {
    const formattedStartDate = startDate.toISOString().split('T')[0];
    const formattedEndDate = endDate.toISOString().split('T')[0];
    return axios.get(`${BASE_URL}/period`, {
      params: {
        startDate: formattedStartDate,
        endDate: formattedEndDate
      }
    });
  }

  /**
   * 복합 조건으로 로그 검색
   * @param {Object} params 검색 파라미터
   * @param {number} [params.page=0] 페이지 번호
   * @param {number} [params.size=10] 페이지 크기
   * @param {number} [params.contractId] 계약 ID
   * @param {number} [params.participantId] 참여자 ID
   * @param {string} [params.eventTypeCodeId] 이벤트 유형 코드
   * @param {Date} [params.startDate] 시작일
   * @param {Date} [params.endDate] 종료일
   * @returns {Promise} API 응답
   */
  searchEventLogs({
    page = 0,
    size = 10,
    contractId,
    participantId,
    eventTypeCodeId,
    startDate,
    endDate
  } = {}) {
    const params = { page, size };

    if (contractId) params.contractId = contractId;
    if (participantId) params.participantId = participantId;
    if (eventTypeCodeId) params.eventTypeCodeId = eventTypeCodeId;
    
    if (startDate) {
      params.startDate = startDate.toISOString().split('T')[0];
    }
    
    if (endDate) {
      params.endDate = endDate.toISOString().split('T')[0];
    }

    return axios.get(`${BASE_URL}/search`, { params });
  }

  /**
   * 이벤트 유형별 통계 조회
   * @returns {Promise} API 응답
   */
  getEventTypeStatistics() {
    return axios.get(`${BASE_URL}/statistics/event-types`);
  }
}

export default new ContractEventLogService(); 