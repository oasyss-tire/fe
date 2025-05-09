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
  InputAdornment,
  FormControl,
  Radio,
  RadioGroup,
  FormControlLabel,
  Tooltip,
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import InfoIcon from '@mui/icons-material/Info';

const ConfirmTextInputModal = ({ open, onClose, onSave, onUpdate, field }) => {
  const [inputText, setInputText] = useState('');
  const [error, setError] = useState('');
  const [isMatch, setIsMatch] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [validationDelay, setValidationDelay] = useState(false); // 검증 지연 상태
  const textFieldRef = useRef(null);
  const typingTimerRef = useRef(null); // 타이핑 타이머 참조
  
  // 선택 옵션 관련 상태
  const [optionGroups, setOptionGroups] = useState([]);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [processedText, setProcessedText] = useState('');
  
  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
    };
  }, []);
  
  // 모달이 열릴 때마다 입력값 초기화 부분 로그 추가
  useEffect(() => {
    if (open && field) {      
      // 편집 모드면 confirmText를, 아니면 value를 초기값으로
      const initialText = field.isEditMode ? (field.confirmText || '') : (field.value || '');
      
      setInputText(initialText);
      setCursorPosition(0);
      setError('');
      setValidationDelay(false);
      
      // 선택 옵션 초기화
      if (!field.isEditMode && field.confirmText) {
        parseOptionsFromText(field.confirmText);
      } else {
        setOptionGroups([]);
        setSelectedOptions({});
        setProcessedText(field.confirmText || '');
        setIsMatch(field.isEditMode ? true : field.value === field.confirmText);
      }
    }
  }, [open, field]);

  // 텍스트에서 선택 옵션 파싱 함수에 로그 추가
  const parseOptionsFromText = (text) => {
    const optionPattern = /\{([^{}]+)\}/g;
    let match;
    const options = [];
    
    // 모든 선택 옵션 찾기
    while ((match = optionPattern.exec(text)) !== null) {
      const fullMatch = match[0]; // {옵션1/옵션2}
      const optionsText = match[1]; // 옵션1/옵션2
      const optionChoices = optionsText.split('/').map(o => o.trim());
      
      options.push({
        startIndex: match.index,
        endIndex: match.index + fullMatch.length,
        fullMatch,
        choices: optionChoices,
        selectedIndex: 0, // 기본적으로 첫 번째 옵션 선택
        id: `option-${options.length}`
      });
    }
    
    setOptionGroups(options);
    
    // 옵션이 없으면 원본 텍스트 사용
    if (options.length === 0) {
      setProcessedText(text);
      setIsMatch(field.value === text);
      return;
    }
    
    // 기본 선택 옵션 설정
    const defaultSelections = {};
    options.forEach((group, index) => {
      defaultSelections[`option-${index}`] = 0; // 각 그룹의 첫 번째 옵션을 기본값으로
    });
    setSelectedOptions(defaultSelections);
    
    // 선택 옵션이 적용된 텍스트 생성
    const initialProcessedText = generateProcessedText(text, options, defaultSelections);
    setProcessedText(initialProcessedText);
    
    // 초기 입력 텍스트와 비교하여 일치 여부 설정
    setIsMatch(field.value === initialProcessedText);
  };
  
  // 선택 옵션을 적용한 텍스트 생성 함수에 로그 추가
  const generateProcessedText = (text, options, selections) => {
    if (!options || options.length === 0) {
      return text;
    }
    
    let result = '';
    let lastIndex = 0;
    
    // 옵션 그룹 순서대로 처리
    options.forEach((option, groupIndex) => {
      // 이전 텍스트 추가
      result += text.substring(lastIndex, option.startIndex);
      
      // 선택된 옵션 추가
      const selectedIndex = selections[`option-${groupIndex}`] || 0;
      const selectedOption = option.choices[selectedIndex];
      result += selectedOption;
      
      lastIndex = option.endIndex;
    });
    
    // 남은 텍스트 추가
    result += text.substring(lastIndex);
    
    return result;
  };
  
  // 옵션 선택 변경 처리 함수에 로그 추가
  const handleOptionChange = (groupId, newValue) => {
    // 문자열로 들어올 경우 숫자로 변환
    const numericValue = parseInt(newValue, 10);
    
    // 새 선택 상태 설정
    const newSelections = { ...selectedOptions, [groupId]: numericValue };
    setSelectedOptions(newSelections);
    
    // 원본 텍스트 가져오기
    const originalText = field.confirmText || '';
    
    // 새로운 처리 텍스트 생성 (직접 생성하여 확실하게 동기화)
    let newProcessedText = originalText;
    
    if (optionGroups.length > 0) {
      // 순차적으로 텍스트 치환
      let result = '';
      let lastIndex = 0;
      
      optionGroups.forEach((option, idx) => {
        // 이전 텍스트 추가
        result += originalText.substring(lastIndex, option.startIndex);
        
        // 선택한 옵션 값 추가
        const selectedIdx = newSelections[`option-${idx}`] || 0;
        const selectedText = option.choices[selectedIdx];
        result += selectedText;
        
        lastIndex = option.endIndex;
      });
      
      // 남은 텍스트 추가
      result += originalText.substring(lastIndex);
      newProcessedText = result;
    }
    
    // 상태 업데이트
    setProcessedText(newProcessedText);
    
    // 현재 입력된 텍스트와 비교
    const normalizedInput = inputText.trim();
    const normalizedProcessed = newProcessedText.trim();
    const exactMatch = normalizedInput === normalizedProcessed;
    
    // isMatch 상태 업데이트
    setIsMatch(exactMatch);
  };

  // 텍스트 입력 핸들러
  const handleTextChange = (e) => {
    const newValue = e.target.value;
    
    setInputText(newValue);
    
    if (textFieldRef.current) {
      setCursorPosition(e.target.selectionStart || 0);
    }
    
    // 편집 모드에서는 즉시 버튼 활성화를 위한 처리
    if (field?.isEditMode) {
      // 입력 텍스트가 있으면 항상 유효함
      if (newValue.trim()) {
        setIsMatch(true);
        setError('');
        setValidationDelay(false);
      } else {
        setError('서명문구를 입력해주세요.');
        setIsMatch(false);
        setValidationDelay(false);
      }
      return; // 편집 모드는 아래 로직 실행 안 함
    }
    
    // 여기서부터는 사용자 모드 로직
    // 타이핑 중임을 표시
    setValidationDelay(false); // 기존 true를 false로 변경
    
    // 선택 옵션이 있는 경우, 처리된 텍스트와 비교
    const textToCompare = optionGroups.length > 0 ? processedText : field?.confirmText || '';
    
    // 양쪽 공백을 제거하고 비교
    const normalizedInput = newValue.trim();
    const normalizedTarget = textToCompare.trim();
    
    // 완전 일치 여부 확인
    const exactMatch = normalizedInput === normalizedTarget;
    
    // 현재 입력한 부분이 올바른지 확인
    const currentCharCorrect = normalizedInput.length > 0 && 
      normalizedInput.length <= normalizedTarget.length && 
      normalizedTarget.substring(0, normalizedInput.length) === normalizedInput;
    
    // 오류 및 일치 상태 즉시 업데이트
    if (!currentCharCorrect && normalizedInput.length > 0) {
      setError('입력한 내용이 서명문구와 일치하지 않습니다.');
      setIsMatch(false);
    } else {
      setError('');
      setIsMatch(exactMatch); // 완전히 일치하면 true, 아니면 false
    }
    
    // 기존 타이머 취소 (더 이상 필요 없음)
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
  };
  
  // 입력 검증 함수에 로그 추가
  const validateInput = (text, compareTo = null) => {
    if (field?.isEditMode) return;
    
    // 선택 옵션이 있는 경우, 처리된 텍스트와 비교
    const textToCompare = compareTo || (optionGroups.length > 0 ? processedText : field?.confirmText || '');
    
    // 양쪽 공백을 제거하고 비교
    const normalizedInput = text.trim();
    const normalizedTarget = textToCompare.trim();
    
    // 전체 일치 여부 확인
    const completeMatch = normalizedInput === normalizedTarget;
    setIsMatch(completeMatch);
    
    // 현재 입력 중인 위치의 문자가 일치하는지 확인
    const currentCharCorrect = normalizedInput.length > 0 && 
      normalizedInput.length <= normalizedTarget.length && 
      normalizedTarget.substring(0, normalizedInput.length) === normalizedInput;
    
    if (!currentCharCorrect && normalizedInput.length > 0) {
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
    if (field?.isEditMode || !field?.confirmText) return null;
    
    // 선택 옵션이 적용된 텍스트 사용
    const confirmText = optionGroups.length > 0 ? processedText : field?.confirmText || '';
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

  // 저장 핸들러 수정
  const handleSave = () => {
    // 중복 클릭 방지를 위해 버튼 상태를 즉시 비활성화 처리
    const isSaving = true;
    
    try {
      // 편집 모드 - 원본 텍스트 저장
      if (field?.isEditMode) {

        
        if (!inputText.trim()) {
          setError('서명문구를 입력해주세요.');
          return;
        }
        
        if (onUpdate) {

          // 입력된 텍스트를 부모 컴포넌트에 전달
          onUpdate(inputText.trim());
          return; // 함수 즉시 종료
        } else {
          onClose();
        }
        
        return;
      }
      
      // 사용자 모드 - 일치 여부 확인 후 저장
      if (!field?.confirmText) {
        setError('서명문구가 없습니다.');
        return;
      }

      // 선택 옵션이 있는 경우, 처리된 텍스트와 비교
      const textToCompare = optionGroups.length > 0 ? processedText : field.confirmText;
      
      // 양쪽 공백을 제거하고 비교
      const normalizedInput = inputText.trim();
      const normalizedTarget = textToCompare.trim();
      
      // 직접 비교한 결과 저장
      const exactMatch = normalizedInput === normalizedTarget;
      
      // 최종 일치 여부 확인
      if (!exactMatch) {
        setError('입력한 문구가 원본 서명문구와 일치하지 않습니다.');
        return;
      }
      
      // 일치하면 저장 진행 - 즉시 onSave 호출
      if (onSave) {
        // 이벤트 버블링 중지와 네이티브 이벤트 중지로 추가 클릭 방지
        setTimeout(() => {
          // 입력 텍스트와 함께 처리 정보도 전달
          onSave(normalizedInput, {
            selectedOptions,       // 선택한 옵션 정보
            processedText,         // 처리된 텍스트
            originalText: field.confirmText  // 원본 텍스트
          });
        }, 0);
      } else {
        onClose();
      }
    } catch (err) {
      console.error('서명문구 저장 중 오류:', err);
      setError('오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  // 입력 가이드를 위한 스타일 정보
  const guideStyles = getTypingGuideStyles();

  // 선택 옵션 UI 렌더링
  const renderOptionSelectors = () => {
    if (field?.isEditMode || optionGroups.length === 0) return null;
    
    return (
      <Box sx={{ mb: 3, mt: 1 }}>
        <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
          서명문구 옵션 선택
        </Typography>

        {/* 안내 메시지 추가 */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'flex-start', 
          p: 1.5, 
          mb: 2, 
          bgcolor: '#F0F7FF', 
          borderRadius: 1,
          border: '1px solid #C2E0FF'
        }}>
          <InfoIcon sx={{ mr: 1, color: '#3182F6', fontSize: '1rem', mt: '2px' }} />
          <Typography variant="caption" sx={{ color: '#0A5AC2', lineHeight: 1.4 }}>
            1. 아래 제시된 옵션 중 해당하는 항목을 선택해주세요.<br />
            2. 선택한 옵션이 반영된 전체 서명문구를 정확히 입력해주세요.<br />
            3. 문구가 정확히 일치해야 저장이 완료됩니다.
          </Typography>
        </Box>

        {optionGroups.map((group, index) => (
          <Box key={`option-group-${index}`} sx={{ mb: 2 }}>
            <Typography variant="caption" sx={{ display: 'block', mb: 0.5, color: '#555' }}>
              옵션 {index + 1}:
            </Typography>
            <FormControl component="fieldset">
              <RadioGroup
                row
                value={selectedOptions[`option-${index}`] || 0}
                onChange={(e) => handleOptionChange(`option-${index}`, e.target.value)}
              >
                {group.choices.map((choice, choiceIndex) => (
                  <FormControlLabel
                    key={`choice-${index}-${choiceIndex}`}
                    value={choiceIndex}
                    control={
                      <Radio 
                        size="small" 
                        sx={{ 
                          color: '#3182F6', 
                          '&.Mui-checked': { color: '#3182F6' } 
                        }}
                      />
                    }
                    label={
                      <Typography variant="body2" sx={{ fontSize: '14px' }}>
                        {choice}
                      </Typography>
                    }
                    sx={{ mr: 2 }}
                  />
                ))}
              </RadioGroup>
            </FormControl>
          </Box>
        ))}
      </Box>
    );
  };

  // 컴포넌트 내 추가 useEffect - 초기 마운트와 processedText 변경 시 검증 수행
  useEffect(() => {
    if (!field?.isEditMode && processedText && inputText) {
      const normalizedInput = inputText.trim();
      const normalizedProcessed = processedText.trim();
      const exactMatch = normalizedInput === normalizedProcessed;
      
      // 일치하면 즉시 isMatch 업데이트
      if (exactMatch) {
        setIsMatch(true);
        setError('');
      }
    }
  }, [processedText, field?.isEditMode, inputText]);

  // 포커스 이동 시에도 다시 검증
  const handleFocus = () => {
    if (!field?.isEditMode && inputText) {
      const textToCompare = optionGroups.length > 0 ? processedText : field?.confirmText || '';
      const normalizedInput = inputText.trim();
      const normalizedTarget = textToCompare.trim();
      
      // 완전 일치 여부 확인
      const exactMatch = normalizedInput === normalizedTarget;
      
      if (exactMatch) {
        setIsMatch(true);
        setError('');
      }
    }
  };

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
        <span>서명문구 입력</span>
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
        {/* 편집 모드 */}
        {field?.isEditMode && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 1, mt: 1, fontWeight: 500 }}>
              사용자가 입력할 서명문구를 입력해주세요
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', mb: 2, color: '#0277bd' }}>
              <span style={{ marginRight: '4px' }}>ℹ️</span>
              선택 옵션은 {'{옵션1/옵션2}'} 형식으로 입력하세요. 예: {'{A타입/B타입}'}
            </Typography>
            <TextField
              inputRef={textFieldRef}
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
        {!field?.isEditMode && field?.confirmText && (
          <>
            <Box sx={{ mb: 2, mt: 2 }}>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                아래 서명문구를 그대로 따라 입력해주세요
              </Typography>
            </Box>
            
            {/* 선택 옵션 UI */}
            {renderOptionSelectors()}
            
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
                  {/* 선택 옵션이 적용된 텍스트 표시 */}
                  {optionGroups.length > 0 ? processedText : field.confirmText}
                </Box>
              )}
              
              {/* 사용자 입력 텍스트 표시 (입력한 문자별로 색상이 다르게 보임) */}
              {!field?.isEditMode && guideStyles?.charStatus && guideStyles.charStatus.length > 0 && (
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
                onFocus={handleFocus}
                onBlur={handleFocus}
                onClick={handleFocus}
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
                  endAdornment: (() => {
                    const targetText = optionGroups.length > 0 ? processedText : field.confirmText;
                    return targetText === inputText && inputText ? (
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
                    ) : null;
                  })(),
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
                (() => {
                  // 선택 옵션이 적용된 텍스트 또는 원본 텍스트
                  const targetText = optionGroups.length > 0 ? processedText : field.confirmText;
                  
                  if (inputText.trim() === targetText.trim()) {
                    return (
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
                    );
                  } else if (error) {
                    return (
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
                    );
                  } else {
                    return (
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
                        {`${inputText.length}/${targetText.length} 글자 입력 중...`}
                      </Typography>
                    );
                  }
                })()
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
          onClick={(e) => {
            e.preventDefault();
            // 이벤트 전파 중지로 버블링 방지
            e.stopPropagation();
            // 즉시 실행
            handleSave();
          }}
          type="button" 
          variant="contained"
          disabled={
            // 편집 모드: 입력만 있으면 활성화
            // 사용자 모드: 정확히 일치해야 활성화
            field?.isEditMode ? !inputText.trim() : !isMatch
          }
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