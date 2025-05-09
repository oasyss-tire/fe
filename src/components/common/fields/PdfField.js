import React, { useState, useRef, useEffect, memo } from 'react';
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
    willChange: 'transform, left, top',
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
    color: '#1976d2',
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

export const TextField = memo(({ field, scale, isDragging, dragTarget, onDragStart, onResizeStart, onDelete, onFieldClick }) => {
  if (!field) {
    console.error('TextField: field prop is undefined');
    return null;
  }
  
  const [isEditing, setIsEditing] = useState(false);
  const [inputText, setInputText] = useState('');
  const inputRef = useRef(null);
  const mouseDownPos = useRef({ x: 0, y: 0 });
  const wasDragged = useRef(false);

  useEffect(() => {
    if (field.description) {
      setInputText(field.description);
    }
  }, [field]);

  // 마우스 다운 이벤트 처리
  const handleMouseDown = (e) => {
    // 이벤트 버블링 방지 - 테스트를 위해 주석 처리
    // e.stopPropagation();
 
    
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
  
  // transform 속성을 사용하여 하드웨어 가속 활용
  // 성능 향상을 위해 백분율로 변환된 CSS 값을 미리 계산
  const left = `${field.relativeX * 100}%`;
  const top = `${field.relativeY * 100}%`;
  const width = `${field.relativeWidth * 100}%`;
  const height = `${field.relativeHeight * 100}%`;
  
  return (
    <Box
      id={field.id}
      sx={{
        ...fieldStyles.base,
        left, top, width, height,
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
        {hasDescription ? (
          <>
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
        ) : (
          <span className="text-label" style={fieldStyles.label}>텍스트</span>
        )}
      </div>
      
      <button className="delete-button" onClick={(e) => onDelete(e, field.id)}>×</button>
      <div className="resize-handle" onMouseDown={(e) => onResizeStart(e, field.id)} style={fieldStyles.resizeHandle} />
    </Box>
  );
});

export const SignatureField = memo(({ field, scale, isDragging, dragTarget, onDragStart, onResizeStart, onDelete }) => {
  if (!field) {
    console.error('SignatureField: field prop is undefined');
    return null;
  }
  
  // 드래그 시작 위치를 저장하기 위한 ref 추가
  const mouseDownPos = useRef({ x: 0, y: 0 });
  const wasDragged = useRef(false);
  
  // 마우스 다운 이벤트 처리
  const handleMouseDown = (e) => {
    // 이벤트 버블링 방지 - 테스트를 위해 주석 처리
    // e.stopPropagation();
    
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
  
  // A4 비율 적용 (정사각형으로 보이도록)
  // 가로:세로 = 1:1.414 비율이므로, 동일한 화면 크기가 되려면 높이를 너비의 0.707배(1/1.414)로 설정
  const aspectRatio = 841.89 / 595.28; // A4 비율 (약 1.414)
  
  // 너비는 그대로 사용하고, 높이를 비율에 맞게 조정
  const width = field.relativeWidth;
  const height = width / aspectRatio; // 화면상 정사각형이 되도록 비율 적용
  
  console.log('SignatureField 렌더링:', { 
    id: field.id, 
    원본너비: field.relativeWidth, 
    원본높이: field.relativeHeight, 
    조정된높이: height,
    적용된비율: aspectRatio,
    정사각형_비율적용: `너비 ${width} × 높이 ${height} = 화면상 정사각형`
  });
  
  return (
    <Box
      id={field.id}
      sx={{
        ...fieldStyles.base,
        left: `${field.relativeX * 100}%`,
        top: `${field.relativeY * 100}%`,
        width: `${width * 100}%`,
        height: `${height * 100}%`,
        borderColor: '#1976d2', // 파란색으로 변경
        cursor: isDragging && dragTarget === field.id ? 'grabbing' : 'pointer',
        '& .delete-button': {
          ...fieldStyles.deleteButton
        }
      }}
      onMouseDown={handleMouseDown}
    >
      <span style={{ ...fieldStyles.label, color: '#1976d2' }}>서명</span>
      <button className="delete-button" onClick={(e) => onDelete(e, field.id)}>×</button>
      <div className="resize-handle" onMouseDown={(e) => onResizeStart(e, field.id)} style={fieldStyles.resizeHandle} />
    </Box>
  );
});

export const CheckboxField = memo(({ field, scale, isDragging, dragTarget, onDragStart, onDelete }) => {
  if (!field) {
    console.error('CheckboxField: field prop is undefined');
    return null;
  }
  
  // 드래그 시작 위치를 저장하기 위한 ref 추가
  const mouseDownPos = useRef({ x: 0, y: 0 });
  const wasDragged = useRef(false);
  
  // 마우스 다운 이벤트 처리
  const handleMouseDown = (e) => {
    // 이벤트 버블링 방지 - 테스트를 위해 주석 처리
    // e.stopPropagation();
    
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
  
  // A4 비율 적용 (정사각형으로 보이도록)
  const aspectRatio = 841.89 / 595.28; // A4 비율 (약 1.414)
  
  // 너비는 그대로 사용하고, 높이를 비율에 맞게 조정
  const width = field.relativeWidth;
  const height = width / aspectRatio; // 화면상 정사각형이 되도록 비율 적용
  
  return (
    <Box
      id={field.id}
      sx={{
        ...fieldStyles.base,
        left: `${field.relativeX * 100}%`,
        top: `${field.relativeY * 100}%`,
        width: `${width * 100}%`,
        height: `${height * 100}%`,
        cursor: isDragging && dragTarget === field.id ? 'grabbing' : 'pointer',
        '& .delete-button': {
          ...fieldStyles.deleteButton
        }
      }}
      onMouseDown={handleMouseDown}
    >
      <CheckBoxOutlineBlankIcon sx={{ color: 'rgba(25, 118, 210, 0.7)', fontSize: '16px' }} />
      <button className="delete-button" onClick={(e) => onDelete(e, field.id)}>×</button>
    </Box>
  );
});

export const ConfirmTextField = memo(({ field, scale, isDragging, dragTarget, onDragStart, onResizeStart, onDelete, onInputSave, onFieldClick }) => {
  if (!field) {
    console.error('ConfirmTextField: field prop is undefined');
    return null;
  }
  
  const [isEditing, setIsEditing] = useState(false);
  const [inputText, setInputText] = useState('');
  const inputRef = useRef(null);
  
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleInputComplete();
    }
  };
  
  const handleInputChange = (e) => {
    setInputText(e.target.value);
  };
  
  const handleInputComplete = () => {
    if (onInputSave) {
      onInputSave(inputText);
    }
    setIsEditing(false);
  };
  
  // 드래그 시작 위치를 저장하기 위한 ref 추가
  const mouseDownPos = useRef({ x: 0, y: 0 });
  const wasDragged = useRef(false);
  
  // 마우스 다운 이벤트 처리
  const handleMouseDown = (e) => {
    if (isEditing) {
      e.stopPropagation();
      return;
    }
    
    // 이벤트 버블링 방지 - 테스트를 위해 주석 처리
    // e.stopPropagation();

    
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
      onFieldClick();
    }
  };
  
  // 성능 향상을 위해 백분율로 변환된 CSS 값을 미리 계산
  const left = `${field.relativeX * 100}%`;
  const top = `${field.relativeY * 100}%`;
  const width = `${field.relativeWidth * 100}%`;
  const height = `${field.relativeHeight * 100}%`;
  
  return (
    <Box
      id={field.id}
      sx={{
        ...fieldStyles.base,
        left, top, width, height,
        border: '2px dashed #1976d2',
        cursor: isDragging && dragTarget === field.id ? 'grabbing' : 'pointer',
        backgroundColor: 'rgba(25, 118, 210, 0.08)',
        '& .delete-button': {
          ...fieldStyles.deleteButton,
        },
        borderColor: field.confirmText ? '#1976d2' : '#1976d2'
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
    >
      {field.confirmText ? (
        <Typography variant="caption" sx={fieldStyles.confirmText}>
          {field.confirmText}
        </Typography>
      ) : (
        <Typography variant="caption" sx={{ ...fieldStyles.confirmText, color: '#1976d2' }}>
          서명문구 입력
        </Typography>
      )}
      
      <button className="delete-button" onClick={(e) => onDelete(e, field.id)}>×</button>
      <div 
        className="resize-handle" 
        onMouseDown={(e) => onResizeStart(e, field.id)} 
        style={{ ...fieldStyles.resizeHandle, borderColor: field.confirmText ? '#1976d2' : '#1976d2' }}
      />
    </Box>
  );
}); 