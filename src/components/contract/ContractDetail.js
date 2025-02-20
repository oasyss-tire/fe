import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Chip,
  Divider,
  Grid,
  Stack
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import { Document, Page } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { pdfjs } from 'react-pdf';
import ContractSignature from './ContractSignature';

// PDF worker 설정 변경
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const ContractDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pdfFile, setPdfFile] = useState(null);
  const [signatureOpen, setSignatureOpen] = useState(false);

  // options 객체를 useMemo로 메모이제이션
  const pdfOptions = useMemo(() => ({
    cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
    cMapPacked: true,
  }), []); // 의존성 배열이 비어있으므로 컴포넌트 마운트 시 한 번만 생성

  useEffect(() => {
    fetchContractData();
  }, [id]);

  useEffect(() => {
    if (id) {
      setPdfFile({
        url: `http://localhost:8080/api/contracts/${id}/pdf`,
        httpHeaders: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
          'Accept': 'application/pdf'
        },
        withCredentials: true
      });
    }
  }, [id]);

  const fetchContractData = async () => {
    try {
      const response = await fetch(`http://localhost:8080/api/contracts/${id}`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        console.log('계약서 상세 데이터:', data); // 데이터 확인용
        setContract(data);
      } else {
        throw new Error('상세 조회 실패');
      }
    } catch (error) {
      console.error('계약서 조회 실패:', error);
      alert('계약서 정보를 불러오는데 실패했습니다.');
      navigate('/contracts');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      // 서명 상태에 따라 다른 엔드포인트 사용
      const endpoint = contract.status === 'SIGNED' 
        ? `http://localhost:8080/api/contracts/${id}/signed-pdf`
        : `http://localhost:8080/api/contracts/${id}/pdf`;

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('PDF 다운로드 실패');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${contract.title || '계약서'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('PDF 다운로드 중 오류 발생:', error);
      // 에러 처리 로직 추가 가능
    }
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const handleSignatureComplete = (success) => {
    if (success) {
      fetchContractData(); // 계약서 정보 새로고침
    }
    setSignatureOpen(false);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!contract) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>계약서를 찾을 수 없습니다.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: { xs: 2, sm: 3 }, 
      maxWidth: { xs: '100%', sm: '600px', md: '900px', lg: '1200px' },
      margin: '0 auto',
      width: '100%'
    }}>
      <Paper sx={{ 
        p: { xs: 2, sm: 3, md: 4 }, 
        mb: 3, 
        borderRadius: 2,
        boxShadow: 'none',
        width: '100%',
        overflow: 'hidden'  // 내용이 넘치지 않도록
      }}>
        {/* 헤더 영역 */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between', 
          alignItems: { xs: 'center', sm: 'center' },
          gap: { xs: 2, sm: 0 },
          mb: 4,
          pb: 3,
          borderBottom: '1px solid #f0f0f0'
        }}>
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 500, 
              color: '#1a1a1a',
              fontSize: { xs: '1.25rem', sm: '1.5rem' },
              textAlign: { xs: 'center', sm: 'left' }
            }}
          >
            {contract.title}
          </Typography>
          <Chip 
            label={contract.status === 'SIGNED' ? '서명완료' : '대기중'} 
            color={contract.status === 'SIGNED' ? 'success' : 'warning'}
            sx={{ 
              fontSize: '0.875rem', 
              height: 28,
              fontWeight: 500
            }}
          />
        </Box>

        {/* Grid 컨테이너 수정 */}
        <Grid container spacing={{ xs: 3, md: 4 }} sx={{ width: '100%' }}>
          {/* 기본 정보 */}
          <Grid item xs={12} md={4}>
            <Box sx={{ 
              mb: { xs: 3, md: 0 },
              width: '100%'
            }}>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  mb: 3, 
                  fontWeight: 600,
                  color: '#1a1a1a',
                  position: 'relative',
                  '&:after': {
                    content: '""',
                    position: 'absolute',
                    bottom: -8,
                    left: 0,
                    width: '30px',
                    height: '2px',
                    backgroundColor: 'primary.main'
                  }
                }}
              >
                기본 정보
              </Typography>
              <Stack spacing={2}>
                <InfoItem label="계약 번호" value={contract.contractNumber} />
                <InfoItem 
                  label="계약 종류" 
                  value={
                    contract.contractType === 'WORK' ? '근로 계약서' :
                    contract.contractType === 'SERVICE' ? '용역 계약서' :
                    contract.contractType === 'LEASE' ? '임대차 계약서' : '기타 계약서'
                  } 
                />
                <InfoItem 
                  label="만료일" 
                  value={
                    contract.expirationDate ? 
                    new Date(contract.expirationDate).toLocaleDateString() : 
                    '설정되지 않음'
                  } 
                />
              </Stack>
            </Box>
          </Grid>

          {/* 계약자 정보 */}
          <Grid item xs={12} md={4}>
            <Box sx={{ 
              mb: { xs: 3, md: 0 },
              width: '100%'
            }}>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  mb: 3, 
                  fontWeight: 600,
                  color: '#1a1a1a',
                  position: 'relative',
                  '&:after': {
                    content: '""',
                    position: 'absolute',
                    bottom: -8,
                    left: 0,
                    width: '30px',
                    height: '2px',
                    backgroundColor: 'primary.main'
                  }
                }}
              >
                계약자 정보
              </Typography>
              <Stack spacing={2}>
                <InfoItem label="이름" value={contract.contractorName} />
                <InfoItem label="이메일" value={contract.contractorEmail} />
                <InfoItem label="연락처" value={contract.contractorPhoneNumber} />
              </Stack>
            </Box>
          </Grid>

          {/* 피계약자 정보 */}
          <Grid item xs={12} md={4}>
            <Box sx={{ 
              width: '100%'
            }}>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  mb: 3, 
                  fontWeight: 600,
                  color: '#1a1a1a',
                  position: 'relative',
                  '&:after': {
                    content: '""',
                    position: 'absolute',
                    bottom: -8,
                    left: 0,
                    width: '30px',
                    height: '2px',
                    backgroundColor: 'primary.main'
                  }
                }}
              >
                피계약자 정보
              </Typography>
              <Stack spacing={2}>
                <InfoItem label="이름" value={contract.contracteeName} />
                <InfoItem label="이메일" value={contract.contracteeEmail} />
                <InfoItem label="연락처" value={contract.contracteePhoneNumber} />
              </Stack>
            </Box>
          </Grid>
        </Grid>

        {/* 계약 설명 */}
        {contract.description && (
          <Box sx={{ mt: 4, pt: 4, borderTop: '1px solid #f0f0f0' }}>
            <Typography 
              variant="subtitle1" 
              sx={{ 
                mb: 3, 
                fontWeight: 600,
                color: '#1a1a1a',
                position: 'relative',
                '&:after': {
                  content: '""',
                  position: 'absolute',
                  bottom: -8,
                  left: 0,
                  width: '30px',
                  height: '2px',
                  backgroundColor: 'primary.main'
                }
              }}
            >
              계약 설명
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                whiteSpace: 'pre-line',
                color: '#424242',
                lineHeight: 1.6
              }}
            >
              {contract.description}
            </Typography>
          </Box>
        )}

        {/* 하단 버튼 그룹 수정 */}
        <Box sx={{ 
          mt: 4, 
          pt: 4,
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2, 
          justifyContent: 'center',
          borderTop: '1px solid #f0f0f0',
          width: '100%'
        }}>
          <Button
            variant="outlined"
            startIcon={
              <ArrowBackIcon sx={{ 
                fontSize: { xs: '20px', sm: '16px', md: '18px' }
              }} />
            }
            onClick={() => navigate('/contracts')}
            sx={{ 
              minWidth: { xs: '100%', sm: 'auto' },
              px: { xs: 2, sm: 1, md: 1.8 },
              borderColor: '#e0e0e0',
              color: '#666',
              '&:hover': { 
                borderColor: '#bdbdbd',
                backgroundColor: '#fafafa'
              },
              order: { xs: 3, sm: 1 },
              fontSize: { xs: '0.9rem', sm: '0.75rem', md: '0.85rem' },
              whiteSpace: 'nowrap',  // 줄바꿈 방지
              height: { sm: '32px' }  // 버튼 높이 고정
            }}
          >
            목록으로
          </Button>
          <Button
            variant="outlined"
            startIcon={
              <DownloadIcon sx={{ 
                fontSize: { xs: '20px', sm: '16px', md: '18px' }
              }} />
            }
            onClick={handleDownload}
            sx={{ 
              minWidth: { xs: '100%', sm: 'auto' },
              px: { xs: 2, sm: 1, md: 1.5 },
              borderColor: '#e0e0e0',
              color: '#666',
              '&:hover': { 
                borderColor: '#bdbdbd',
                backgroundColor: '#fafafa'
              },
              order: { xs: 2, sm: 2 },
              fontSize: { xs: '0.9rem', sm: '0.75rem', md: '0.8rem' },
              whiteSpace: 'nowrap',
              height: { sm: '32px' }
            }}
          >
            {contract.status === 'SIGNED' ? '서명된 PDF' : 'PDF'} 다운로드
          </Button>
          {contract.status !== 'SIGNED' && (
            <Button
              variant="contained"
              startIcon={
                <EditIcon sx={{ 
                  fontSize: { xs: '20px', sm: '16px', md: '18px' }
                }} />
              }
              onClick={() => setSignatureOpen(true)}
              sx={{ 
                minWidth: { xs: '100%', sm: 'auto' },
                px: { xs: 2, sm: 1, md: 1.5 },
                bgcolor: '#343959',
                '&:hover': { bgcolor: '#3d63b8' },
                order: { xs: 1, sm: 3 },
                fontSize: { xs: '0.9rem', sm: '0.75rem', md: '0.8rem' },
                whiteSpace: 'nowrap',  // 줄바꿈 방지
                height: { sm: '32px' }  // 버튼 높이 고정
              }}
            >
              서명하기
            </Button>
          )}
        </Box>
      </Paper>

      {/* 서명 모달 */}
      <ContractSignature
        open={signatureOpen}
        onClose={handleSignatureComplete}
        contractId={id}
      />
    </Box>
  );
};

// 정보 아이템 컴포넌트
const InfoItem = ({ label, value }) => (
  <Box>
    <Typography 
      variant="subtitle2" 
      sx={{ 
        color: '#666',
        mb: 0.5,
        fontSize: '0.875rem'
      }}
    >
      {label}
    </Typography>
    <Typography 
      variant="body1"
      sx={{ 
        color: '#1a1a1a',
        fontSize: '0.925rem'
      }}
    >
      {value || '-'}
    </Typography>
  </Box>
);

export default ContractDetail; 