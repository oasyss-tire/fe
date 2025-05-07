import React, { useState, useRef, useEffect } from 'react';
import { Box, Typography, TextField as MuiTextField } from '@mui/material';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import ConfirmTextInputModal from './ConfirmTextInputModal';

const fieldStyles = {
  base: {
    position: 'absolute',
    border: '2px dashed #1976d2',
    backgroundColor: 'rgba(25, 118, 210, 0.08)',
    zIndex: 10,
    transformOrigin: '0 0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    '&:hover': {
      borderColor: '#0d47a1',
      boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.2)',
      '& .delete-button': {
        opacity: 1
      }
    }
  },
  deleteButton: {
    position: 'absolute',
    right: '-6px',
    top: '-6px',
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: '#fff',
    border: '1.5px solid #ef5350',
    color: '#ef5350',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    opacity: 0,
    transition: 'all 0.2s',
    zIndex: 2,
    fontSize: '10px',
    padding: 0,
    '&:hover': {
      backgroundColor: '#ef5350',
      color: '#fff'
    }
  },
  resizeHandle: {
    position: 'absolute',
    width: '8px',
    height: '8px',
    background: '#fff',
    border: '1px solid #1976d2',
    borderRadius: '50%',
    right: '-4px',
    bottom: '-4px',
    cursor: 'se-resize',
    zIndex: 1,
    '&:hover': {
      background: '#1976d2'
    }
  },
  label: {
    color: '#1976d2',
    fontSize: '12px',
    opacity: 0.7,
    pointerEvents: 'none',
    userSelect: 'none'
  },
  confirmText: {
    color: '#f57c00',
    fontSize: '12px',
    opacity: 0.7,
    pointerEvents: 'none',
    userSelect: 'none',
    padding: '4px',
    textAlign: 'center',
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    wordBreak: 'break-word',
    overflow: 'hidden'
  }
};

export const TextField = ({ field, scale, isDragging, dragTarget, onDragStart, onResizeStart, onDelete, onFieldClick }) => {
  if (!field) {
    console.error('TextField: field prop is undefined');
    return null;
  }
  
  const [isEditing, setIsEditing] = useState(false);
  const [inputText, setInputText] = useState('');
  const inputRef = useRef(null);
  // 드래그 시작 위치를 저장하기 위한 ref 추가
  const mouseDownPos = useRef({ x: 0, y: 0 });
  const wasDragged = useRef(false);

  useEffect(() => {
    // 필드에 description이 있으면 설정
    if (field.description) {
      setInputText(field.description);
    }
  }, [field]);

  // 마우스 다운 이벤트 처리
  const handleMouseDown = (e) => {
    // 현재 마우스 위치 저장
    mouseDownPos.current = { x: e.clientX, y: e.clientY };
    wasDragged.current = false;
    
    // 드래그 시작 함수 호출
    onDragStart(e, field.id);
    
    // 마우스 업 이벤트를 한 번만 감지하기 위한 이벤트 리스너 추가
    document.addEventListener('mouseup', handleMouseUp, { once: true });
  };
  
  // 마우스 업 이벤트 처리
  const handleMouseUp = (e) => {
    // 마우스 다운 위치와 현재 위치의 차이 계산
    const dx = Math.abs(e.clientX - mouseDownPos.current.x);
    const dy = Math.abs(e.clientY - mouseDownPos.current.y);
    
    // 위치 차이가 3px 이상이면 드래그로 간주
    if (dx > 3 || dy > 3) {
      wasDragged.current = true;
    }
  };

  const handleClick = (e) => {
    e.stopPropagation();
    
    // 드래그 중이거나 드래그가 발생했으면 클릭 이벤트 무시
    if (isDragging || wasDragged.current) return;
    
    if (onFieldClick) {
      onFieldClick(field.id);
    }
  };

  // 필드에 설명이 있는지 여부 확인
  const hasDescription = field.description && field.description.trim() !== '';
  // 필드에 형식이 있는지 여부 확인
  const hasFormat = field.formatCodeId && field.formatCodeId.trim() !== '';
  
  return (
    <Box
      sx={{
        ...fieldStyles.base,
        left: `${field.x}px`,
        top: `${field.y}px`,
        width: `${field.width}px`,
        height: `${field.height}px`,
        transform: `scale(${scale || 1})`,
        cursor: isDragging && dragTarget === field.id ? 'grabbing' : 'pointer',
        '& .delete-button': {
          ...fieldStyles.deleteButton
        },
        '&:hover .delete-button': {
          opacity: 1
        }
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
    >
      {/* 필드 내부 콘텐츠 */}
      <div style={{ 
        width: '100%', 
        height: '100%', 
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '4px'
      }}>
        {/* 설명이 있는 경우 - 상단에 레이블로 표시 */}
        {hasDescription && (
          <>
            {/* 헤더 레이블 */}
            <Typography variant="caption" sx={{ 
              fontSize: '11px', 
              color: '#1976d2', 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              right: 0, 
              textAlign: 'center',
              fontWeight: 'bold',
              backgroundColor: 'rgba(255, 255, 255, 0.5)',
              py: 0.2,
              height: '18px',
              lineHeight: '18px',
              zIndex: 1
            }}>
              {field.description}
            </Typography>
            
          </>
        )}
        
        {/* 설명이 없는 경우 - 기본 텍스트 표시 */}
        {!hasDescription && (
          <span className="text-label" style={fieldStyles.label}>텍스트</span>
        )}
      </div>
      
      <button className="delete-button" onClick={(e) => onDelete(e, field.id)}>×</button>
      <div className="resize-handle" onMouseDown={(e) => onResizeStart(e, field.id)} style={fieldStyles.resizeHandle} />
    </Box>
  );
};

export const SignatureField = ({ field, scale, isDragging, dragTarget, onDragStart, onResizeStart, onDelete }) => {
  if (!field) {
    console.error('SignatureField: field prop is undefined');
    return null;
  }
  
  // 드래그 시작 위치를 저장하기 위한 ref 추가
  const mouseDownPos = useRef({ x: 0, y: 0 });
  const wasDragged = useRef(false);
  
  // 마우스 다운 이벤트 처리
  const handleMouseDown = (e) => {
    // 현재 마우스 위치 저장
    mouseDownPos.current = { x: e.clientX, y: e.clientY };
    wasDragged.current = false;
    
    // 드래그 시작 함수 호출
    onDragStart(e, field.id);
    
    // 마우스 업 이벤트를 한 번만 감지하기 위한 이벤트 리스너 추가
    document.addEventListener('mouseup', handleMouseUp, { once: true });
  };
  
  // 마우스 업 이벤트 처리
  const handleMouseUp = (e) => {
    // 마우스 다운 위치와 현재 위치의 차이 계산
    const dx = Math.abs(e.clientX - mouseDownPos.current.x);
    const dy = Math.abs(e.clientY - mouseDownPos.current.y);
    
    // 위치 차이가 3px 이상이면 드래그로 간주
    if (dx > 3 || dy > 3) {
      wasDragged.current = true;
    }
  };
  
  return (
    <Box
      sx={{
        ...fieldStyles.base,
        left: `${field.x}px`,
        top: `${field.y}px`,
        width: `${field.width}px`,
        height: `${field.height}px`,
        minHeight: '20px',
        transform: `scale(${scale || 1})`,
        cursor: isDragging && dragTarget === field.id ? 'grabbing' : 'grab',
        '& .delete-button': {
          ...fieldStyles.deleteButton
        },
        '&:hover .delete-button': {
          opacity: 1
        }
      }}
      onMouseDown={handleMouseDown}
    >
      <span className="text-label" style={fieldStyles.label}>서명</span>
      <button className="delete-button" onClick={(e) => onDelete(e, field.id)}>×</button>
      <div className="resize-handle" onMouseDown={(e) => onResizeStart(e, field.id)} style={fieldStyles.resizeHandle} />
    </Box>
  );
};

export const CheckboxField = ({ field, scale, isDragging, dragTarget, onDragStart, onDelete }) => {
  if (!field) {
    console.error('CheckboxField: field prop is undefined');
    return null;
  }
  
  // 드래그 시작 위치를 저장하기 위한 ref 추가
  const mouseDownPos = useRef({ x: 0, y: 0 });
  const wasDragged = useRef(false);
  
  // 마우스 다운 이벤트 처리
  const handleMouseDown = (e) => {
    // 현재 마우스 위치 저장
    mouseDownPos.current = { x: e.clientX, y: e.clientY };
    wasDragged.current = false;
    
    // 드래그 시작 함수 호출
    onDragStart(e, field.id);
    
    // 마우스 업 이벤트를 한 번만 감지하기 위한 이벤트 리스너 추가
    document.addEventListener('mouseup', handleMouseUp, { once: true });
  };
  
  // 마우스 업 이벤트 처리
  const handleMouseUp = (e) => {
    // 마우스 다운 위치와 현재 위치의 차이 계산
    const dx = Math.abs(e.clientX - mouseDownPos.current.x);
    const dy = Math.abs(e.clientY - mouseDownPos.current.y);
    
    // 위치 차이가 3px 이상이면 드래그로 간주
    if (dx > 3 || dy > 3) {
      wasDragged.current = true;
    }
  };
  
  return (
    <Box
      sx={{
        ...fieldStyles.base,
        left: `${field.x}px`,
        top: `${field.y}px`,
        width: '20px',
        height: '20px',
        transform: `scale(${scale || 1})`,
        cursor: isDragging && dragTarget === field.id ? 'grabbing' : 'grab',
        '& .delete-button': {
          ...fieldStyles.deleteButton
        },
        '&:hover .delete-button': {
          opacity: 1
        }
      }}
      onMouseDown={handleMouseDown}
    >
      <CheckBoxOutlineBlankIcon className="checkbox-icon" sx={fieldStyles.label} />
      <button className="delete-button" onClick={(e) => onDelete(e, field.id)}>×</button>
    </Box>
  );
};

export const ConfirmTextField = ({ field, scale, isDragging, dragTarget, onDragStart, onResizeStart, onDelete, onInputSave, onFieldClick }) => {
  if (!field) {
    console.error('ConfirmTextField: field prop is undefined');
    return null;
  }
  
  const [isEditing, setIsEditing] = useState(false);
  const [inputText, setInputText] = useState('');
  const [hasInput, setHasInput] = useState(false); // 사용자 입력 여부 추적
  const inputRef = useRef(null);
  // 드래그 시작 위치를 저장하기 위한 ref 추가
  const mouseDownPos = useRef({ x: 0, y: 0 });
  const wasDragged = useRef(false);
  
  // 디버깅을 위한 상태 체크
  useEffect(() => {
  }, [field, inputText, hasInput]);
  
  // 필드 데이터에서 초기값 설정
  useEffect(() => {
    if (field?.confirmText) {
      setInputText(field.confirmText);
      setHasInput(true);
    }
  }, [field]);
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleInputComplete();
    }
  };
  
  const handleInputChange = (e) => {
    const newText = e.target.value;
    setInputText(newText);
    setHasInput(newText.trim() !== ''); // 입력 여부 업데이트
  };
  
  const handleInputComplete = () => {
    if (isEditing) {
      if (field?.isEditMode && onInputSave) {
        onInputSave(inputText);
      }
      setIsEditing(false);
    }
  };
  
  // 마우스 다운 이벤트 처리
  const handleMouseDown = (e) => {
    if (isEditing) return;
    
    // 현재 마우스 위치 저장
    mouseDownPos.current = { x: e.clientX, y: e.clientY };
    wasDragged.current = false;
    
    // 드래그 시작 함수 호출
    onDragStart(e, field.id);
    
    // 마우스 업 이벤트를 한 번만 감지하기 위한 이벤트 리스너 추가
    document.addEventListener('mouseup', handleMouseUp, { once: true });
  };
  
  // 마우스 업 이벤트 처리
  const handleMouseUp = (e) => {
    // 마우스 다운 위치와 현재 위치의 차이 계산
    const dx = Math.abs(e.clientX - mouseDownPos.current.x);
    const dy = Math.abs(e.clientY - mouseDownPos.current.y);
    
    // 위치 차이가 3px 이상이면 드래그로 간주
    if (dx > 3 || dy > 3) {
      wasDragged.current = true;
    }
  };
  
  const handleClick = (e) => {
    e.stopPropagation();
    
    // 드래그 중이거나 드래그가 발생했으면 클릭 이벤트 무시
    if (isDragging || wasDragged.current) return;
    
    if (field?.isEditMode) {
      setIsEditing(true);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 10);
      return;
    }
    
    if (onFieldClick) {
      onFieldClick();
    }
  };
  
  // 기본 레이아웃 구성
  return (
    <Box
      sx={{
        ...fieldStyles.base,
        left: `${field.x}px`,
        top: `${field.y}px`,
        width: `${field.width}px`,
        height: `${field.height}px`,
        transform: `scale(${scale || 1})`,
        cursor: isDragging && dragTarget === field.id ? 'grabbing' : (isEditing ? 'text' : 'pointer'),
        border: '2px dashed #1976d2',
        backgroundColor: 'rgba(25, 118, 210, 0.08)',
        '& .delete-button': {
          ...fieldStyles.deleteButton,
          border: '1.5px solid #ef5350',
          color: '#ef5350',
          '&:hover': {
            backgroundColor: '#ef5350',
            color: '#fff'
          }
        },
        '&:hover': {
          borderColor: '#0d47a1',
          boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.2)',
          '& .delete-button': {
            opacity: 1
          }
        }
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
    >
      {/* 필드 내부 콘텐츠 */}
      <div style={{ 
        width: '100%', 
        height: '100%', 
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 0
      }}>
        {/* 서명문구 없거나 아직 입력 안 했을 때 - 안내 메시지 표시 */}
        {!isEditing && !hasInput && (
          <span className="text-label" style={{ 
            ...fieldStyles.label,
            color: '#1976d2',
            fontSize: '11px'
          }}>
            서명문구
          </span>
        )}
        
        {/* 서명문구 있고 편집 중이 아닐 때 - 입력한 텍스트만 표시 */}
        {!isEditing && hasInput && (
          <div style={{
            fontSize: '11px',
            color: '#1976d2',
            overflow: 'hidden',
            textAlign: 'center',
            width: '100%',
            height: '100%',
            fontWeight: 'bold',
            cursor: 'pointer',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            lineHeight: '1.1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {inputText}
          </div>
        )}
        
        {/* 편집 모드 입력 필드 */}
        {isEditing && field?.isEditMode && (
          <MuiTextField
            inputRef={inputRef}
            variant="standard"
            fullWidth
            multiline
            value={inputText}
            onChange={handleInputChange}
            onBlur={handleInputComplete}
            onKeyDown={handleKeyDown}
            placeholder="이 영역에 서명문구를 입력하세요"
            autoFocus
            InputProps={{
              disableUnderline: true,
              style: {
                fontSize: '11px',
                padding: 0,
                color: '#1976d2',
                fontWeight: 'bold',
                textAlign: 'center',
                height: '100%',
                display: 'flex',
                alignItems: 'center'
              }
            }}
            sx={{
              width: '100%',
              height: '100%',
              '& .MuiInputBase-root': {
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0
              }
            }}
          />
        )}
      </div>
      
      {/* 삭제/리사이즈 버튼 */}
      {!isEditing && (
        <>
          <button className="delete-button" onClick={(e) => onDelete(e, field.id)}>×</button>
          <div 
            className="resize-handle" 
            onMouseDown={(e) => onResizeStart(e, field.id)} 
            style={{
              ...fieldStyles.resizeHandle,
              border: '1px solid #1976d2'
            }} 
          />
        </>
      )}
    </Box>
  );
}; 