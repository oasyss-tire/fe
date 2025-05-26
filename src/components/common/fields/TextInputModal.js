import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Typography, Box, Alert, CircularProgress } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

const TextInputModal = ({ open, onClose, onSave, initialValue = '', field, niceAuthData }) => {
  const [text, setText] = useState(initialValue);
  const [error, setError] = useState('');
  const [isValid, setIsValid] = useState(true);
  const [isAddressSearching, setIsAddressSearching] = useState(false); // 주소 검색 중 상태
  
  // 카카오 지도 스크립트 로드 상태
  const [isKakaoMapScriptLoaded, setIsKakaoMapScriptLoaded] = useState(false);

  useEffect(() => {
    setText(initialValue);
    validateInput(initialValue);
    
    // 주소 형식일 경우 카카오 맵 스크립트 로드
    if (field?.formatCodeId === '001004_0008' && !window.daum) {
      loadKakaoMapScript();
    }
  }, [initialValue, field]);
  
  // 카카오 맵 스크립트 로드 함수
  const loadKakaoMapScript = () => {
    const script = document.createElement('script');
    script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
    script.async = true;
    script.onload = () => {
      setIsKakaoMapScriptLoaded(true);
    };
    document.head.appendChild(script);
  };
  
  // 주소 검색 함수
  const handleAddressSearch = () => {
    setIsAddressSearching(true);
    
    // 스크립트가 로드되지 않았다면 다시 로드 시도
    if (!window.daum || !window.daum.Postcode) {
      loadKakaoMapScript();
      setError('주소 검색 기능을 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      setIsAddressSearching(false);
      return;
    }
    
    new window.daum.Postcode({
      oncomplete: function(data) {
        // 선택한 주소 데이터를 가공
        let fullAddress = data.address;
        let extraAddress = '';
        
        // 건물명이 있을 경우 추가
        if (data.buildingName !== '') {
          extraAddress += (extraAddress !== '' ? ', ' + data.buildingName : data.buildingName);
        }
        
        // 상세주소와 참고항목 합치기
        if (extraAddress !== '') {
          fullAddress += ` (${extraAddress})`;
        }
        
        // 주소 입력 필드에 반영
        setText(fullAddress);
        validateInput(fullAddress);
        setIsAddressSearching(false);
      },
      onclose: function() {
        setIsAddressSearching(false);
      },
      width: '100%',
      height: '460px'
    }).open();
  };

  // 입력값 유효성 검사 함수
  const validateInput = (value) => {
    // 주민등록번호 유효성 검사
    if (field?.formatCodeId === '001004_0002') {
      // 숫자만 추출 (하이픈 제외)
      const numbersOnly = value.replace(/\D/g, '');
      
      // 주민등록번호는 13자리여야 함
      if (numbersOnly.length > 0 && numbersOnly.length !== 13) {
        setError('주민등록번호는 13자리(하이픈 포함 14자리)여야 합니다.');
        setIsValid(false);
        return false;
      } else if (numbersOnly.length === 0) {
        setError('');
        setIsValid(true);
        return true;
      }
      
      // NICE 인증 데이터와 비교 (인증이 완료되고 13자리가 입력된 경우에만)
      if (niceAuthData && numbersOnly.length === 13) {
        // 주민등록번호 앞 6자리 (생년월일)와 인증 데이터의 생년월일 비교
        const inputBirthDate = numbersOnly.substring(0, 6);
        
        // NICE 인증 데이터에서 앞 2자리 제거 (19960726 -> 960726)
        const authBirthDate = niceAuthData.birthDate.substring(2);
        
        if (inputBirthDate !== authBirthDate) {
          setError('본인인증 시 확인된 생년월일과 일치하지 않습니다.');
          setIsValid(false);
          return false;
        }
      }
    }
    
    // 핸드폰 번호 유효성 검사
    if (field?.formatCodeId === '001004_0001') {
      const numbersOnly = value.replace(/\D/g, '');
      if (numbersOnly.length > 0 && numbersOnly.length !== 11) {
        setError('핸드폰 번호는 11자리(하이픈 포함 13자리)여야 합니다.');
        setIsValid(false);
        return false;
      }
    }
    
    // 이름 유효성 검사 (간단하게)
    if (field?.formatCodeId === '001004_0009') {
      // 최소 2글자 이상만 체크
      if (value.trim().length > 0 && value.trim().length < 2) {
        setError('이름은 최소 2글자 이상 입력해주세요.');
        setIsValid(false);
        return false;
      }
      
      // NICE 인증 데이터와 비교 (인증이 완료된 경우에만)
      if (niceAuthData && value.trim().length >= 2) {
        if (value.trim() !== niceAuthData.name) {
          setError('본인인증 시 확인된 이름과 일치하지 않습니다.');
          setIsValid(false);
          return false;
        }
      }
    }
    
    setError('');
    setIsValid(true);
    return true;
  };

  // 입력 형식에 따른 포맷팅 함수
  const formatInputValue = (value, formatCodeId) => {
    if (!formatCodeId || !value) return value;
    
    // 숫자만 추출
    const numbersOnly = value.replace(/\D/g, '');
    
    // 핸드폰 번호 포맷 (010-1234-5678)
    if (formatCodeId === '001004_0001') {
      if (numbersOnly.length <= 3) {
        return numbersOnly;
      } else if (numbersOnly.length <= 7) {
        return `${numbersOnly.slice(0, 3)}-${numbersOnly.slice(3)}`;
      } else {
        return `${numbersOnly.slice(0, 3)}-${numbersOnly.slice(3, 7)}-${numbersOnly.slice(7, 11)}`;
      }
    }
    
    // 주민등록번호 포맷 (123456-1234567)
    if (formatCodeId === '001004_0002') {
      if (numbersOnly.length <= 6) {
        return numbersOnly;
      } else {
        return `${numbersOnly.slice(0, 6)}-${numbersOnly.slice(6, 13)}`;
      }
    }
    
    // 금액 형식 (1,000,000)
    if (formatCodeId === '001004_0003') {
      // 숫자가 없으면 빈 문자열 반환
      if (numbersOnly.length === 0) return '';
      
      // 1000단위로 콤마 추가
      return Number(numbersOnly).toLocaleString('ko-KR');
    }
    
    // 금액(한글) 형식
    if (formatCodeId === '001004_0004') {
      // 숫자만 제거 (나머지 문자는 허용)
      const noNumbers = value.replace(/[0-9]/g, '');
      return noNumbers;
    }
    
    // 날짜-년도 형식 (4자리)
    if (formatCodeId === '001004_0005') {
      // 4자리로 제한
      return numbersOnly.slice(0, 4);
    }
    
    // 날짜-월 형식 (2자리)
    if (formatCodeId === '001004_0006') {
      const month = numbersOnly.slice(0, 2);
      // 유효한 월 범위(1~12) 확인
      if (month.length > 0) {
        const monthValue = parseInt(month, 10);
        if (monthValue > 12) {
          return '12';
        } else if (monthValue === 0) {
          return '01';
        }
      }
      return month;
    }
    
    // 날짜-일 형식 (2자리)
    if (formatCodeId === '001004_0007') {
      const day = numbersOnly.slice(0, 2);
      // 유효한 일 범위(1~31) 확인
      if (day.length > 0) {
        const dayValue = parseInt(day, 10);
        if (dayValue > 31) {
          return '31';
        } else if (dayValue === 0) {
          return '01';
        }
      }
      return day;
    }
    
    // 주소 형식 - 특별한 포맷팅 없이 그대로 반환
    if (formatCodeId === '001004_0008') {
      return value; // 주소는 특별한 포맷팅 없이 입력 그대로 사용
    }
    
    // 이름 형식 - 그대로 반환 (포맷팅 없음)
    if (formatCodeId === '001004_0009') {
      return value; // 이름은 특별한 포맷팅 없이 입력 그대로 사용
    }
    
    // 다른 형식 코드에 대한 처리를 여기에 추가할 수 있음
    
    return value;
  };

  const handleInputChange = (e) => {
    const inputValue = e.target.value;
    
    // 형식이 지정된 경우 포맷팅 적용
    if (field?.formatCodeId) {
      const formattedValue = formatInputValue(inputValue, field.formatCodeId);
      setText(formattedValue);
      
      // 유효성 검사 실행
      validateInput(formattedValue);
    } else {
      setText(inputValue);
      validateInput(inputValue);
    }
  };

  const handleSave = () => {
    // 저장 전 유효성 다시 확인
    if (validateInput(text)) {
      onSave(text);
      setText('');
      setError('');
    }
  };

  const handleClose = () => {
    setText('');
    setError('');
    onClose();
  };

  // 입력 제한 설정
  const getMaxLength = () => {
    if (field?.formatCodeId === '001004_0001') return 13; // 010-1234-5678
    if (field?.formatCodeId === '001004_0002') return 14; // 123456-1234567
    if (field?.formatCodeId === '001004_0003') return 20; // 최대 19자리 숫자 + 콤마
    if (field?.formatCodeId === '001004_0004') return 30; // 금액(한글)
    if (field?.formatCodeId === '001004_0005') return 4;  // 년도(YYYY)
    if (field?.formatCodeId === '001004_0006') return 2;  // 월(MM)
    if (field?.formatCodeId === '001004_0007') return 2;  // 일(DD)
    if (field?.formatCodeId === '001004_0008') return 100; // 주소는 넉넉하게 100자 제한
    if (field?.formatCodeId === '001004_0009') return 20; // 이름은 20자 제한
    return undefined; // 제한 없음
  };

  // 설명이 있으면 그 값을 사용하고, 없으면 '원하는 값'으로
  const promptText = field?.description 
    ? `${field.description} 값을 입력해주세요` 
    : '원하는 값을 입력해주세요';
  
  // 형식 안내 메시지
  const getFormatGuideText = () => {
    if (field?.formatCodeId === '001004_0001') {
      return '핸드폰 번호 형식 (예: 010-1234-5678)';
    }
    if (field?.formatCodeId === '001004_0002') {
      return niceAuthData 
        ? '주민등록번호 형식 (예: 123456-1234567) - 본인인증 시 확인된 정보와 일치해야 합니다'
        : '주민등록번호 형식 (예: 123456-1234567)';
    }
    if (field?.formatCodeId === '001004_0003') {
      return '금액 형식 (예: 1,000,000)';
    }
    if (field?.formatCodeId === '001004_0004') {
      return '금액을 한글로 입력해 주세요 (예: 삼백만원, 일억오천만원) - 숫자 입력 불가';
    }
    if (field?.formatCodeId === '001004_0005') {
      return '연도 입력 (예: 2025)';
    }
    if (field?.formatCodeId === '001004_0006') {
      return '월 입력 (01~12)';
    }
    if (field?.formatCodeId === '001004_0007') {
      return '일 입력 (01~31)';
    }
    if (field?.formatCodeId === '001004_0008') {
      return '주소 검색 버튼을 클릭하여 주소를 검색하거나 직접 입력해 주세요';
    }
    if (field?.formatCodeId === '001004_0009') {
      return niceAuthData 
        ? '이름 입력 (최소 2글자 이상) - 본인인증 시 확인된 이름과 일치해야 합니다'
        : '이름 입력 (최소 2글자 이상)';
    }
    return null;
  };

  const formatGuideText = getFormatGuideText();

  // 입력 타입 결정 (날짜 관련 필드는 숫자만 입력)
  const getInputType = () => {
    if (field?.formatCodeId === '001004_0005' || 
        field?.formatCodeId === '001004_0006' || 
        field?.formatCodeId === '001004_0007') {
      return 'number';
    }
    return 'text';
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '8px',
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.08)',
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle sx={{ 
        borderBottom: '1px solid #F0F0F0', 
        py: 2, 
        px: 3, 
        fontSize: '1rem', 
        fontWeight: 600 
      }}>
        {field?.description ? `${field.description} 입력` : '텍스트 입력'}
      </DialogTitle>
      <DialogContent sx={{ p: 3 }}>
        <Typography variant="body2" sx={{ mb: 2, mt: 2, color: '#505050' }}>
          {promptText}
        </Typography>
        
        {formatGuideText && (
          <Typography variant="caption" sx={{ display: 'block', mb: 1, color: '#0277bd', fontSize: '0.75rem' }}>
            <span style={{ fontSize: '0.7rem', marginRight: '4px' }}>ℹ️</span>
            {formatGuideText}
          </Typography>
        )}
        
        {/* 주소 검색 필드일 경우 검색 버튼 표시 */}
        {field?.formatCodeId === '001004_0008' ? (
          <Box sx={{ display: 'flex', gap: 1, width: '100%', mb: 1 }}>
            <TextField
              autoFocus
              fullWidth
              value={text}
              onChange={handleInputChange}
              error={!!error}
              inputProps={{
                maxLength: getMaxLength(),
              }}
              sx={{ 
                flexGrow: 1,
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: error ? '#f44336' : '#E0E0E0',
                  },
                  '&:hover fieldset': {
                    borderColor: error ? '#f44336' : '#BDBDBD',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: error ? '#f44336' : '#3182F6',
                  },
                },
              }}
            />
            <Button
              variant="contained"
              onClick={handleAddressSearch}
              disabled={isAddressSearching}
              startIcon={isAddressSearching ? <CircularProgress size={16} /> : <SearchIcon />}
              sx={{
                bgcolor: '#3182F6',
                '&:hover': {
                  bgcolor: '#1565C0',
                },
                whiteSpace: 'nowrap',
                minWidth: '100px'
              }}
            >
              {isAddressSearching ? '검색 중' : '주소 검색'}
            </Button>
          </Box>
        ) : (
          <TextField
            autoFocus
            fullWidth
            value={text}
            onChange={handleInputChange}
            type={getInputType()}
            error={!!error}
            inputProps={{
              maxLength: getMaxLength(),
              min: field?.formatCodeId === '001004_0006' ? 1 : field?.formatCodeId === '001004_0007' ? 1 : undefined,
              max: field?.formatCodeId === '001004_0006' ? 12 : field?.formatCodeId === '001004_0007' ? 31 : undefined
            }}
            sx={{ 
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: error ? '#f44336' : '#E0E0E0',
                },
                '&:hover fieldset': {
                  borderColor: error ? '#f44336' : '#BDBDBD',
                },
                '&.Mui-focused fieldset': {
                  borderColor: error ? '#f44336' : '#3182F6',
                },
              },
            }}
          />
        )}
        
        {error && (
          <Box sx={{ mt: 1 }}>
            <Alert severity="error" sx={{ py: 0, fontSize: '0.75rem' }}>
              {error}
            </Alert>
          </Box>
        )}
        
        {/* 주소 입력 도움말 */}
        {field?.formatCodeId === '001004_0008' && (
          <Box sx={{ mt: 2 }}>
            <Alert severity="info" sx={{ py: 0.5, fontSize: '0.75rem' }}>
              주소 검색 후 상세 주소를 추가로 입력하실 수 있습니다. (예: 101동 1001호)
            </Alert>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #F0F0F0', justifyContent: 'flex-end' }}>
        <Button 
          onClick={handleClose}
          sx={{ 
            color: '#666',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
            },
            fontWeight: 500,
            px: 2
          }}
        >
          취소
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained"
          disabled={!isValid || (field?.formatCodeId === '001004_0002' && text.replace(/\D/g, '').length !== 13)}
          sx={{ 
            bgcolor: '#3182F6', 
            '&:hover': {
              bgcolor: '#1565C0',
            },
            '&.Mui-disabled': {
              bgcolor: 'rgba(49, 130, 246, 0.3)',
            },
            fontWeight: 500,
            boxShadow: 'none',
            px: 2
          }}
        >
          저장
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TextInputModal; 