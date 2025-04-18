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
    right: '-8px',
    top: '-8px',
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    backgroundColor: '#fff',
    border: '2px solid #ef5350',
    color: '#ef5350',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    opacity: 0,
    transition: 'all 0.2s',
    zIndex: 2,
    fontSize: '12px',
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

  useEffect(() => {
    // 필드에 description이 있으면 설정
    if (field.description) {
      setInputText(field.description);
    }
  }, [field]);

  const handleClick = (e) => {
    e.stopPropagation();
    
    if (isDragging) return;
    
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
      onMouseDown={(e) => onDragStart(e, field.id)}
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
        
        {/* 형식이 있는 경우 - 하단에 형식 정보 표시 */}
        {hasFormat && (
          <Typography variant="caption" sx={{ 
            fontSize: '9px', 
            color: '#0277bd', 
            position: 'absolute', 
            bottom: 0, 
            left: 0, 
            right: 0, 
            textAlign: 'center',
            fontStyle: 'italic',
            backgroundColor: 'rgba(255, 255, 255, 0.5)',
            py: 0.1,
            height: '14px',
            lineHeight: '14px'
          }}>
            <span style={{ fontSize: '6px', marginRight: '3px' }}>⚙️</span>
            {field.formatName || field.formatCodeId}
          </Typography>
        )}
        
        {/* 설명이 없는 경우 - 기본 텍스트 표시 */}
        {!hasDescription && !hasFormat && (
          <span className="text-label" style={fieldStyles.label}>텍스트</span>
        )}
        
        {/* 설명이 없지만 형식은 있는 경우 */}
        {!hasDescription && hasFormat && (
          <span className="text-label" style={{...fieldStyles.label, marginBottom: '14px'}}>텍스트</span>
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
      onMouseDown={(e) => onDragStart(e, field.id)}
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
      onMouseDown={(e) => onDragStart(e, field.id)}
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
  
  // 디버깅을 위한 상태 체크
  useEffect(() => {
    console.log('ConfirmTextField 마운트/업데이트:', { 
      id: field.id, 
      confirmText: field.confirmText ? field.confirmText.substring(0, 20) + '...' : null,
      isEditMode: field.isEditMode,
      inputText: inputText ? inputText.substring(0, 20) + '...' : null,
      hasInput
    });
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
  
  const handleClick = (e) => {
    e.stopPropagation();
    
    if (isDragging) return;
    
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
  
  // 필드 배경색과 테두리 스타일 설정
  const fieldBgStyle = field?.isEditMode 
    ? 'rgba(245, 124, 0, 0.05)'
    : 'rgba(245, 124, 0, 0.08)';
    
  const borderStyle = field?.isEditMode 
    ? '1px dashed #f57c00'
    : '2px dashed #f57c00';
  
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
        border: borderStyle,
        backgroundColor: fieldBgStyle,
        '& .delete-button': {
          ...fieldStyles.deleteButton,
          border: '2px solid #f57c00',
          color: '#f57c00',
          '&:hover': {
            backgroundColor: '#f57c00',
            color: '#fff'
          }
        },
        '&:hover': {
          borderColor: '#e65100',
          boxShadow: '0 0 0 2px rgba(245, 124, 0, 0.1)',
          '& .delete-button': {
            opacity: 1
          }
        }
      }}
      onMouseDown={(e) => {
        if (!isEditing) {
          onDragStart(e, field.id);
        }
      }}
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
                fontSize: '12px',
                padding: '2px',
                color: '#e65100',
                fontWeight: 'normal',
                textAlign: 'center',
                minHeight: '100%'
              }
            }}
            sx={{
              width: '100%',
              height: '100%',
              '& .MuiInputBase-root': {
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }
            }}
          />
        )}
        
        {/* 서명문구 있고 편집 중이 아닐 때 - 입력한 텍스트만 표시 */}
        {!isEditing && hasInput && (
          <Typography variant="body2" sx={{ 
            fontSize: '14px',
            color: '#e65100', 
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 6,
            WebkitBoxOrient: 'vertical',
            textAlign: 'center',
            width: '100%',
            height: '100%',
            py: 0.5,
            fontWeight: 'bold',
            cursor: 'pointer'
          }}>
            {inputText}
          </Typography>
        )}
        
        {/* 서명문구 없거나 아직 입력 안 했을 때 - 헤더와 안내 메시지 표시 */}
        {!isEditing && !hasInput && (
          <>
            {/* 헤더 레이블 */}
            <Typography variant="caption" sx={{ 
              fontSize: '11px', 
              color: '#f57c00', 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              right: 0, 
              textAlign: 'center',
              fontWeight: 'bold',
              backgroundColor: 'rgba(255, 255, 255, 0.4)',
              py: 0.2,
              height: '18px',
              lineHeight: '18px',
              zIndex: 1
            }}>
              {field?.isEditMode ? '서명문구 영역' : '서명문구'}
            </Typography>
            
            {/* 하단 안내 메시지 */}
            <Typography variant="body2" sx={{ 
              fontSize: '10px',
              color: '#999', 
              fontStyle: 'italic',
              textAlign: 'center',
              position: 'absolute',
              bottom: 2,
              left: 0,
              right: 0
            }}>
              {field?.isEditMode ? '클릭하여 서명문구 입력' : '클릭하여 입력하세요'}
            </Typography>
          </>
        )}
        
        {/* 입력 완료 표시 */}
        {!isEditing && !field?.isEditMode && field?.value && (
          <Typography variant="body2" sx={{ 
            fontSize: '10px',
            color: '#4CAF50', 
            fontStyle: 'normal',
            textAlign: 'center',
            position: 'absolute',
            bottom: 2,
            left: 0,
            right: 0
          }}>
            ✓ 입력 완료
          </Typography>
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
              border: '1px solid #f57c00'
            }} 
          />
        </>
      )}
    </Box>
  );
}; 