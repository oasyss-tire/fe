import React, { useState, useEffect, useRef } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  Button, 
  Box, 
  Typography,
  Alert,
  Paper,
  InputAdornment
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const ConfirmTextInputModal = ({ open, onClose, onSave, onUpdate, field }) => {
  const [inputText, setInputText] = useState('');
  const [error, setError] = useState('');
  const [isMatch, setIsMatch] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [validationDelay, setValidationDelay] = useState(false); // 검증 지연 상태
  const textFieldRef = useRef(null);
  const typingTimerRef = useRef(null); // 타이핑 타이머 참조
  
  // 관리자 모드 여부 확인
  const isAdminMode = field?.isEditMode || !field?.confirmText;
  
  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
    };
  }, []);
  
  // 모달이 열릴 때마다 입력값 초기화
  useEffect(() => {
    if (open && field) {
      console.log('ConfirmTextInputModal 열림:', { 
        fieldId: field.id, 
        isEditMode: field.isEditMode, 
        confirmText: field.confirmText,
        value: field.value
      });
      
      // 관리자 모드면 confirmText를, 사용자 모드면 value를 초기값으로
      setInputText(isAdminMode ? (field.confirmText || '') : (field.value || ''));
      setCursorPosition(0);
      setError('');
      setIsMatch(isAdminMode ? true : field.value === field.confirmText);
      setValidationDelay(false);
    }
  }, [open, field, isAdminMode]);

  // 텍스트 입력 핸들러
  const handleTextChange = (e) => {
    const newValue = e.target.value;
    setInputText(newValue);
    
    if (textFieldRef.current) {
      setCursorPosition(e.target.selectionStart || 0);
    }
    
    // 타이핑 중임을 표시
    setValidationDelay(true);
    
    // 기존 타이머 취소
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }
    
    // 타이핑이 잠시 멈추면 검증 수행 (500ms 딜레이)
    typingTimerRef.current = setTimeout(() => {
      setValidationDelay(false);
      validateInput(newValue);
    }, 500);
    
    // 관리자 모드면 항상 유효
    if (isAdminMode) {
      setIsMatch(true);
      setError('');
    }
  };
  
  // 입력 검증 함수 (타이머에 의해 호출됨)
  const validateInput = (text) => {
    if (isAdminMode) return;
    
    const confirmText = field?.confirmText || '';
    
    // 전체 일치 여부 확인
    const completeMatch = text === confirmText;
    setIsMatch(completeMatch);
    
    // 현재 입력 중인 위치의 문자가 일치하는지 확인
    const currentCharCorrect = text.length > 0 && 
      text.length <= confirmText.length && 
      confirmText.substring(0, text.length) === text;
    
    if (!currentCharCorrect && text.length > 0) {
      setError('입력한 내용이 서명문구와 일치하지 않습니다.');
    } else {
      setError('');
    }
  };

  // 커서 위치 변경 감지
  const handleCursorChange = (e) => {
    if (textFieldRef.current) {
      setCursorPosition(e.target.selectionStart || 0);
    }
  };

  // 배경 텍스트 스타일 생성을 위한 함수
  const getTypingGuideStyles = () => {
    if (isAdminMode || !field?.confirmText) return null;
    
    const confirmText = field?.confirmText || '';
    const inputLen = inputText.length;
    
    // 글자 단위 정확성 검증을 위한 배열 생성
    const charStatus = [];
    
    for (let i = 0; i < inputLen; i++) {
      if (i < confirmText.length) {
        // 입력된 글자가 원본 텍스트의 해당 위치 글자와 일치하는지 확인
        charStatus.push({
          char: inputText[i],
          isCorrect: inputText[i] === confirmText[i]
        });
      } else {
        // 원본 텍스트보다 더 많이 입력한 경우 모두 오류로 처리
        charStatus.push({
          char: inputText[i],
          isCorrect: false
        });
      }
    }
    
    // 전체 입력 텍스트가 원본과 일치하는지 여부
    const isFullyCorrect = inputLen <= confirmText.length && 
      confirmText.substring(0, inputLen) === inputText;
    
    return {
      charStatus,
      isFullyCorrect,
      confirmText,
      inputLen
    };
  };

  // 저장 핸들러
  const handleSave = () => {
    console.log('저장 버튼 클릭:', { 
      isAdminMode, 
      inputText, 
      fieldId: field?.id 
    });
    
    // 관리자 모드 - 원본 텍스트 저장
    if (isAdminMode) {
      if (!inputText.trim()) {
        setError('서명문구를 입력해주세요.');
        return;
      }
      console.log('관리자 모드로 업데이트 호출');
      if (onUpdate) {
        onUpdate(inputText.trim());
      }
      onClose(); // 모달 닫기
      return;
    }
    
    // 사용자 모드 - 일치 여부 확인 후 저장
    if (!field?.confirmText) {
      setError('서명문구가 없습니다.');
      return;
    }

    if (inputText !== field.confirmText) {
      setError('입력한 문구가 원본 서명문구와 일치하지 않습니다.');
      return;
    }

    console.log('사용자 모드로 저장 호출');
    if (onSave) {
      onSave(inputText);
    }
    onClose(); // 모달 닫기
  };

  // 입력 가이드를 위한 스타일 정보
  const guideStyles = getTypingGuideStyles();

  return (
    <Dialog
      open={open}
      onClose={onClose}
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
        fontWeight: 600,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span>{isAdminMode ? '서명문구 입력' : '서명문구 입력'}</span>
        <Button 
          onClick={onClose}
          sx={{ 
            minWidth: 'auto', 
            p: 0.5,
            color: 'text.secondary',
            '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' }
          }}
        >
          <CloseIcon fontSize="small" />
        </Button>
      </DialogTitle>
      
      <DialogContent sx={{ p: 3, pb: 2 }}>
        {/* 관리자 모드 */}
        {isAdminMode && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
              사용자가 입력할 서명문구를 입력해주세요
            </Typography>
            <TextField
              fullWidth
              label="서명문구 입력"
              value={inputText}
              onChange={handleTextChange}
              multiline
              minRows={3}
              maxRows={5}
              error={!!error}
              helperText={error}
              autoFocus
              placeholder="예: 본인은 위와 같은 내용을 정확히 읽고 이해하였습니다."
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '4px',
                }
              }}
            />
          </Box>
        )}
        
        {/* 사용자 모드 */}
        {!isAdminMode && field?.confirmText && (
          <>
            <Box sx={{ mb: 2 , mt: 2}}>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                아래 서명문구를 그대로 따라 입력해주세요
              </Typography>
            </Box>
            
            {/* 텍스트 입력창: 실시간 문자 검증 UI */}
            <Box sx={{ position: 'relative', mb: 3 }}>
              {/* 배경 가이드 텍스트 (전체 서명문구 보이게) */}
              {field?.confirmText && (
                <Box 
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    padding: '16.5px 14px',
                    pointerEvents: 'none',
                    fontSize: '16px',
                    fontFamily: '"Roboto","Helvetica","Arial",sans-serif',
                    lineHeight: 1.5,
                    letterSpacing: '0.00938em',
                    whiteSpace: 'pre-wrap',
                    zIndex: 1,
                    overflowWrap: 'break-word',
                    wordBreak: 'break-word',
                    overflowY: 'hidden',
                    color: '#BDBDBD'
                  }}
                >
                  {field.confirmText}
                </Box>
              )}
              
              {/* 사용자 입력 텍스트 표시 (입력한 문자별로 색상이 다르게 보임) */}
              {!isAdminMode && guideStyles?.charStatus && guideStyles.charStatus.length > 0 && (
                <Box 
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    padding: '16.5px 14px',
                    pointerEvents: 'none',
                    fontSize: '16px',
                    fontFamily: '"Roboto","Helvetica","Arial",sans-serif',
                    lineHeight: 1.5,
                    letterSpacing: '0.00938em',
                    whiteSpace: 'pre-wrap',
                    zIndex: 3,
                    overflowWrap: 'break-word',
                    wordBreak: 'break-word',
                    overflowY: 'hidden',
                    fontWeight: 500
                  }}
                >
                  {/* 각 글자별로 정확성에 따라 색상 적용 */}
                  {guideStyles.charStatus.map((status, index) => (
                    <span 
                      key={index} 
                      style={{ 
                        // 타이핑 중일 때는 모든 글자를 검은색으로 표시하고, 타이핑이 멈춘 후에만 색상 적용
                        color: validationDelay ? '#000' : (status.isCorrect ? '#3182F6' : '#F44336'),
                      }}
                    >
                      {status.char}
                    </span>
                  ))}
                </Box>
              )}
              
              <TextField
                inputRef={textFieldRef}
                fullWidth
                value={inputText}
                onChange={handleTextChange}
                onSelect={handleCursorChange}
                onKeyUp={handleCursorChange}
                onMouseUp={handleCursorChange}
                multiline
                minRows={3}
                maxRows={5}
                placeholder=""
                error={!!error && !validationDelay} // 테두리 색상만 빨간색으로 변경
                helperText="" // helperText는 항상 비워둠, 하단의 고정 영역에만 메시지 표시
                autoFocus
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '4px',
                    '& fieldset': {
                      // 타이핑 중에는 항상 포커스 상태(파란색) 테두리 유지
                      borderColor: validationDelay ? '#3182F6' : 
                                  (guideStyles?.isFullyCorrect && inputText) ? '#3182F6' : 
                                  (error) ? '#F44336' : '#E0E0E0',
                      borderWidth: (guideStyles?.isFullyCorrect && inputText && !validationDelay) ? '2px' : '1px',
                    },
                    '&:hover fieldset': {
                      // 타이핑 중에는 항상 포커스 상태(파란색) 테두리 유지
                      borderColor: validationDelay ? '#3182F6' : 
                                  (guideStyles?.isFullyCorrect && inputText) ? '#3182F6' : 
                                  (error) ? '#F44336' : '#BDBDBD',
                    },
                    '&.Mui-focused fieldset': {
                      // 타이핑 중에는 항상 포커스 상태(파란색) 테두리 유지
                      borderColor: '#3182F6',
                    }
                  },
                  '& .MuiInputBase-input': {
                    zIndex: 2,
                    position: 'relative',
                    backgroundColor: 'transparent',
                    fontSize: '16px',
                    lineHeight: '1.5',
                    letterSpacing: '0.00938em',
                    fontFamily: '"Roboto","Helvetica","Arial",sans-serif',
                    color: 'transparent',  // 원래 입력 텍스트는 투명하게 (위에 색상 표시된 텍스트만 보이게)
                    caretColor: '#3182F6', // 커서는 파란색으로 보이게
                    fontWeight: 500
                  },
                  // helperText 영역 높이를 0으로 설정하여 공간 차지하지 않도록 함
                  '& .MuiFormHelperText-root': {
                    margin: 0,
                    height: 0,
                    overflow: 'hidden'
                  }
                }}
                InputProps={{
                  endAdornment: field.confirmText === inputText && inputText ? (
                    <InputAdornment position="end">
                      <Box sx={{ 
                        color: '#3182F6', 
                        display: 'flex', 
                        alignItems: 'center',
                        fontSize: '14px',
                        fontWeight: 'bold'
                      }}>
                        ✓ 완료
                      </Box>
                    </InputAdornment>
                  ) : null,
                  sx: {
                    backgroundColor: 'rgba(255, 255, 255, 0.85)', // 배경 텍스트가 비치지 않게 반투명 배경
                  }
                }}
              />
            </Box>
            
            {/* 피드백 메시지 영역 - 높이 고정으로 UI 점프 방지 */}
            <Box sx={{ 
              mb: 2, 
              height: '36px', // 고정 높이 설정
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end'
            }}>
              {inputText && !validationDelay ? (
                inputText === field.confirmText ? (
                  // 완전히 일치하는 경우
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#3182F6', 
                      textAlign: 'right',
                      fontWeight: 500,
                      width: '100%'
                    }}
                  >
                    서명문구가 일치합니다!
                  </Typography>
                ) : error ? (
                  // 오류가 있는 경우
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#F44336', 
                      textAlign: 'right',
                      fontWeight: 500,
                      width: '100%'
                    }}
                  >
                    오타가 있습니다. 빨간색 부분을 확인해주세요.
                  </Typography>
                ) : (
                  // 부분적으로 일치하는 경우 (입력 중)
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#3182F6', 
                      textAlign: 'right',
                      fontWeight: 500,
                      width: '100%'
                    }}
                  >
                    {`${inputText.length}/${field.confirmText.length} 글자 입력 중...`}
                  </Typography>
                )
              ) : (
                // 빈 상태일 때도 공간 유지 (높이만 차지하는 투명 요소)
                <Box sx={{ width: '100%', height: '100%' }}></Box>
              )}
            </Box>
          </>
        )}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #F0F0F0' }}>
        <Button 
          onClick={onClose} 
          variant="outlined"
          sx={{ 
            color: '#666',
            borderColor: '#E0E0E0',
            '&:hover': {
              borderColor: '#BDBDBD',
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
            },
            fontWeight: 500,
            px: 3
          }}
        >
          취소
        </Button>
        <Button 
          onClick={handleSave}
          variant="contained"
          disabled={!isMatch || !inputText || validationDelay} // 타이핑 중에는 버튼 비활성화
          sx={{ 
            bgcolor: isAdminMode ? '#3182F6' : (isMatch ? '#3182F6' : '#3182F6'), 
            '&:hover': {
              bgcolor: isAdminMode ? '#1565C0' : (isMatch ? '#1565C0' : '#1565C0'),
            },
            '&.Mui-disabled': {
              bgcolor: 'rgba(49, 130, 246, 0.3)',
            },
            fontWeight: 500,
            boxShadow: 'none',
            px: 3
          }}
        >
          확인
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmTextInputModal; 