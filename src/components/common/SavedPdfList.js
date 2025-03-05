import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  IconButton,
  Paper,
  Divider
} from '@mui/material';
import { 
  Create as CreateIcon,
  Download as DownloadIcon
} from '@mui/icons-material';

const SavedPdfList = () => {
  const [pdfList, setPdfList] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPdfList = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/contract-pdf/saved-pdfs');
        if (!response.ok) throw new Error('PDF 목록 조회 실패');
        const data = await response.json();
        setPdfList(data);
      } catch (error) {
        console.error('PDF 목록 조회 중 오류:', error);
      }
    };
    fetchPdfList();
  }, []);

  // 서명하기 버튼 클릭 시
  const handleSign = (pdfId) => {
    navigate(`/pdf-viewer/${pdfId}`);  // SignaturePdfViewer로 이동
  };

  // PDF 다운로드
  const handleDownload = async (pdfId) => {
    window.open(`http://localhost:8080/api/contract-pdf/download/${pdfId}`, '_blank');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        서명할 PDF 목록
      </Typography>
      <Paper>
        <List>
          {pdfList.length === 0 ? (
            <ListItem>
              <ListItemText primary="저장된 PDF가 없습니다." />
            </ListItem>
          ) : (
            pdfList.map((pdfId, index) => (
              <React.Fragment key={pdfId}>
                {index > 0 && <Divider />}
                <ListItem
                  secondaryAction={
                    <Box>
                      <IconButton 
                        edge="end" 
                        onClick={() => handleSign(pdfId)}
                        title="서명하기"
                      >
                        <CreateIcon />
                      </IconButton>
                      <IconButton 
                        edge="end" 
                        onClick={() => handleDownload(pdfId)}
                        title="다운로드"
                      >
                        <DownloadIcon />
                      </IconButton>
                    </Box>
                  }
                >
                  <ListItemText 
                    primary={pdfId.replace('_with_fields.pdf', '')} 
                    secondary={new Date(parseInt(pdfId.split('_')[0])).toLocaleString()}
                  />
                </ListItem>
              </React.Fragment>
            ))
          )}
        </List>
      </Paper>
    </Box>
  );
};

export default SavedPdfList; 