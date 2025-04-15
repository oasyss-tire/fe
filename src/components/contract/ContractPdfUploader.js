import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button,
  IconButton
} from '@mui/material';
import { 
  CloudUpload as CloudUploadIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { usePdf } from '../../contexts/PdfContext';

const ContractPdfUploader = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const navigate = useNavigate();
  const { setPdfFile, setFileName, setPdfId } = usePdf();

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setPdfFile(file);
      setFileName(file.name);
    }
  };

  const handleDragEnter = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);

    const file = event.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setPdfFile(file);
      setFileName(file.name);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('https://sign.jebee.net/api/contract-pdf/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('PDF 업로드 실패');
      }

      const pdfId = await response.text();
      setPdfId(pdfId);
      navigate(`/pdf-editor/${pdfId}`);
    } catch (error) {
      console.error('PDF 업로드 중 오류:', error);
      // 에러 처리 (예: 사용자에게 알림)
    }
  };

  const handleUploadSuccess = async (pdfId) => {
    // 업로드 성공 후 영역 지정 페이지로 이동
    window.location.href = `/pdf-editor/${pdfId}`;  // 경로 수정
  };

  return (
    <Box sx={{ 
      p: 3,
      backgroundColor: '#F8F8FE',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {/* 중앙 컨텐츠 */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
          계약서 등록 및 서명 영역 지정
        </Typography>
        <Typography variant="body1" color="text.secondary">
          계약서를 등록하시려면 pdf를 업로드해주세요
        </Typography>
      </Box>

      <Box
        sx={{
          width: '100%',
          maxWidth: 500,
          height: 250,
          border: '2px dashed',
          borderColor: isDragging ? '#1976d2' : '#E0E0E0',
          borderRadius: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isDragging ? '#F0F7FF' : 'white',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          '&:hover': {
            borderColor: '#1976d2',
            backgroundColor: '#F8F9FA'
          }
        }}
        component="label"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept="application/pdf"
          hidden
          onChange={handleFileSelect}
        />
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          gap: 2 
        }}>
          <Box sx={{ 
            width: 80, 
            height: 80, 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#F0F7FF',
            borderRadius: '50%'
          }}>
            <EditIcon sx={{ fontSize: 40, color: '#1976d2' }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 500 }}>
            {selectedFile ? selectedFile.name : 'PDF 파일을 업로드해주세요'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            드래그하여 파일을 업로드하거나 여기를 클릭하세요
          </Typography>
        </Box>
      </Box>

      <Button
        variant="contained"
        sx={{
          mt: 4,
          px: 4,
          py: 1,
          backgroundColor: '#1976d2',
          '&:hover': {
            backgroundColor: '#1565c0',
          },
          '&.Mui-disabled': {
            backgroundColor: '#E0E0E0',
          },
          borderRadius: '8px',
          fontSize: '1rem'
        }}
        disabled={!selectedFile}
        onClick={handleUpload}
      >
        pdf 파일 선택
      </Button>
    </Box>
  );
};

export default ContractPdfUploader;
