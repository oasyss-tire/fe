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

export const TextField = ({ field, scale, isDragging, dragTarget, onDragStart, onResizeStart, onDelete }) => {
  if (!field) {
    console.error('TextField: field prop is undefined');
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
      <span className="text-label" style={fieldStyles.label}>텍스트</span>
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
  const inputRef = useRef(null);
  
  useEffect(() => {
    if (field?.confirmText) {
      setInputText(field.confirmText);
    }
  }, [field]);

  const handleInputChange = (e) => {
    setInputText(e.target.value);
  };

  const handleInputComplete = () => {
    console.log('handleInputComplete 호출됨:', { 
      isEditing, 
      fieldId: field?.id, 
      isEditMode: field?.isEditMode,
      inputText
    });
    
    if (isEditing) {
      if (field?.isEditMode && onInputSave) {
        console.log('onInputSave 호출됨');
        onInputSave(inputText);
      }
      setIsEditing(false);
    }
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleInputComplete();
    }
  };
  
  const handleClick = (e) => {
    e.stopPropagation();
    console.log('ConfirmTextField 클릭됨:', field?.id);
    
    if (isDragging) return;
    
    // 직접 편집 모드일 때
    if (field?.isEditMode) {
      console.log('직접 편집 모드로 전환');
      setIsEditing(true);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 10);
      return;
    }
    
    // 모달 열기 (관리자 모드가 아닐 때)
    if (onFieldClick) {
      console.log('onFieldClick 호출됨');
      onFieldClick();
    }
  };

  const fieldBgStyle = field?.isEditMode 
    ? 'rgba(245, 124, 0, 0.05)'
    : 'rgba(245, 124, 0, 0.08)';
    
  const borderStyle = field?.isEditMode 
    ? '1px dashed #f57c00'
    : '2px dashed #f57c00';
    
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
        {isEditing && field?.isEditMode ? (
          <MuiTextField
            inputRef={inputRef}
            variant="standard"
            fullWidth
            multiline
            value={inputText}
            onChange={handleInputChange}
            onBlur={handleInputComplete}
            onKeyDown={handleKeyDown}
            placeholder="이 영역에 따라써야 할 텍스트를 입력하세요"
            autoFocus
            InputProps={{
              disableUnderline: true,
              style: {
                fontSize: '9px',
                padding: '0px',
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
        ) : (
          <>
            <Typography variant="caption" sx={{ 
              fontSize: '10px', 
              color: '#f57c00', 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              right: 0, 
              textAlign: 'center',
              fontWeight: 'bold',
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              py: 0.1
            }}>
              {field?.isEditMode ? '따라쓰기 영역' : '따라쓰기'}
            </Typography>
            
            {field?.confirmText && (
              <Typography variant="body2" sx={{ 
                fontSize: '9px', 
                color: '#e65100', 
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: field?.isEditMode ? 20 : 2,
                WebkitBoxOrient: 'vertical',
                textAlign: 'center',
                width: '100%',
                mt: field?.isEditMode ? 0.5 : 1,
                mb: 0.5,
                fontWeight: 'bold',
                cursor: 'pointer'
              }}>
                {field?.confirmText}
              </Typography>
            )}
            
            {(!field?.confirmText || field?.isEditMode) && (
              <Typography variant="body2" sx={{ 
                fontSize: '8px', 
                color: '#999', 
                fontStyle: 'italic',
                textAlign: 'center',
                position: 'absolute',
                bottom: 2,
                left: 0,
                right: 0
              }}>
                {field?.isEditMode ? '클릭하여 원본 텍스트 입력' : '클릭하여 입력하세요'}
              </Typography>
            )}
            
            {!field?.isEditMode && field?.value && (
              <Typography variant="body2" sx={{ 
                fontSize: '8px', 
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
          </>
        )}
      </div>
      
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