import React from 'react';
import { Box } from '@mui/material';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';

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
  }
};

export const TextField = ({ field, scale, isDragging, dragTarget, onDragStart, onResizeStart, onDelete }) => (
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

export const SignatureField = ({ field, scale, isDragging, dragTarget, onDragStart, onResizeStart, onDelete }) => (
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

export const CheckboxField = ({ field, scale, isDragging, dragTarget, onDragStart, onDelete }) => (
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