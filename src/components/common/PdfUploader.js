import React, { useState, useEffect } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { usePdf } from '../../context/PdfContext';

const PdfUploader = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const navigate = useNavigate();
  const { setPdfFile, setFileName, setPdfId } = usePdf();

  const handleFileChange = (event) => {
    const file = event.target.files[0];
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
      const response = await fetch('http://localhost:8080/api/contract-pdf/upload', {
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
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        PDF 파일 업로드
      </Typography>
      <input
        accept="application/pdf"
        type="file"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        id="pdf-upload"
      />
      <label htmlFor="pdf-upload">
        <Button
          variant="outlined"
          component="span"
          sx={{ mr: 2 }}
        >
          파일 선택
        </Button>
      </label>
      {selectedFile && (
        <>
          <Typography variant="body2" sx={{ my: 1 }}>
            선택된 파일: {selectedFile.name}
          </Typography>
          <Button
            variant="contained"
            onClick={handleUpload}
            sx={{ mt: 2 }}
          >
            업로드
          </Button>
        </>
      )}
    </Box>
  );
};

export default PdfUploader;
