import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Paper,
  LinearProgress,
  Button
} from '@mui/material';
import { LocationOn as LocationOnIcon, Label as LabelIcon, Draw as DrawIcon, Download as DownloadIcon } from '@mui/icons-material';

const ContractDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);

  // 계약 상세 정보 조회
  useEffect(() => {
    const fetchContractDetail = async () => {
      try {
        const response = await fetch(`http://localhost:8080/api/contracts/${id}`);
        if (!response.ok) throw new Error('계약 조회 실패');
        const data = await response.json();
        console.log('Contract participants:', data.participants);  // 데이터 확인
        setContract(data);
      } catch (error) {
        console.error('계약 조회 중 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchContractDetail();
  }, [id]);

  // 서명 버튼 클릭 핸들러
  const handleSignatureClick = (participant) => {
    window.location.href = `/contract-sign/${contract.id}/participant/${participant.id}`;
  };

  // 다운로드 핸들러 추가
  const handleDownloadSignedPdf = async (pdfId) => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/contract-pdf/download-signed-pdf/${pdfId}`,
        { method: 'GET' }
      );

      if (!response.ok) throw new Error('PDF 다운로드 실패');

      // 파일 다운로드 처리
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `signed_${pdfId}`;  // 파일명 설정
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('PDF 다운로드 중 오류가 발생했습니다.');
    }
  };

  // 모든 서명된 PDF 다운로드 핸들러 추가
  const handleDownloadAllSignedPdfs = async (participantId) => {
    try {
      // 서명된 모든 PDF 목록 조회
      const response = await fetch(
        `http://localhost:8080/api/contract-pdf/download-all-signed-pdfs/${participantId}`,
        { method: 'GET' }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData || 'PDF 조회 실패');
      }

      const signedPdfs = await response.json();
      
      if (signedPdfs.length === 0) {
        alert('다운로드할 서명된 문서가 없습니다.');
        return;
      }
      
      // 각 PDF 순차적으로 다운로드
      for (const pdfInfo of signedPdfs) {
        await new Promise(resolve => setTimeout(resolve, 300)); // 다운로드 간격 설정
        
        const downloadResponse = await fetch(
          `http://localhost:8080${pdfInfo.downloadUrl}`,
          { method: 'GET' }
        );
        
        if (!downloadResponse.ok) continue;
        
        const blob = await downloadResponse.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${pdfInfo.templateName}_${pdfInfo.pdfId}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }

    } catch (error) {
      console.error('Error downloading all PDFs:', error);
      alert('PDF 다운로드 중 오류가 발생했습니다: ' + error.message);
    }
  };

  if (loading) return <Box>로딩중...</Box>;
  if (!contract) return <Box>계약 정보를 찾을 수 없습니다.</Box>;

  return (
    <>
      <Box sx={{ p: 3, backgroundColor: '#F8F8FE', minHeight: '100vh' }}>
        {/* 상단 헤더 */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#3A3A3A' }}>
            계약 조회
          </Typography>
        </Box>

        {/* 전체 컨테이너 */}
        <Paper sx={{ 
          p: 3,
          borderRadius: 2,
          boxShadow: 'none',
          border: '1px solid #EEEEEE'
        }}>
          {/* 계약 정보 섹션 */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#3A3A3A', mb: 2 }}>
              계약 정보
            </Typography>
            <Paper sx={{ 
              p: 3,
              borderRadius: 1,
              boxShadow: 'none',
              border: '1px solid #EEEEEE'
            }}>
              <Box sx={{ display: 'grid', rowGap: 3 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: '120px 1fr' }}>
                  <Typography sx={{ color: '#666' }}>제목</Typography>
                  <Typography>{contract.title}</Typography>
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: '120px 1fr' }}>
                  <Typography sx={{ color: '#666' }}>작성일</Typography>
                  <Typography>
                    {new Date(contract.createdAt).toLocaleDateString('ko-KR', {
                      year: '2-digit',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false
                    })}
                  </Typography>
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: '120px 1fr' }}>
                  <Typography sx={{ color: '#666' }}>계약 상태</Typography>
                  <Box sx={{ 
                    backgroundColor: '#E8F3FF',
                    color: '#1976d2',
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 1,
                    width: 'fit-content',
                    fontSize: '0.875rem'
                  }}>
                    {contract.progressRate === 100 ? '계약 완료' : 
                     contract.progressRate > 0 ? '서명 진행중' : '서명 전'}
                  </Box>
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography sx={{ color: '#666' }}>서명 진행률</Typography>
                    <Typography sx={{ color: '#1976d2' }}>
                      {contract.participants.filter(p => p.signed).length} / {contract.participants.length}명 
                      ({contract.progressRate}%)
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={contract.progressRate}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: '#E8F3FF',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: '#1976d2',
                        borderRadius: 4,
                      },
                    }}
                  />
                </Box>
              </Box>
            </Paper>
          </Box>

          {/* 계약서 정보 섹션 */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#3A3A3A', mb: 2 }}>
              계약서 정보
            </Typography>
            <Paper sx={{ 
              p: 3,
              borderRadius: 1,
              boxShadow: 'none',
              border: '1px solid #EEEEEE'
            }}>
              <Box sx={{ display: 'grid', rowGap: 3 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center' }}>
                  <Typography sx={{ color: '#666' }}>제목</Typography>
                  <Typography>{contract.templateName}</Typography>
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center' }}>
                  <Typography sx={{ color: '#666' }}>구분</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LabelIcon sx={{ color: '#1976d2', fontSize: 20 }} />
                    <Typography>위수탁 계약서</Typography>
                  </Box>
                </Box>
              </Box>
            </Paper>
          </Box>

          {/* 서명 참여자 정보 섹션 */}
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#3A3A3A', mb: 2 }}>
              서명 참여자 정보
            </Typography>
            <Paper sx={{ 
              p: 3,
              borderRadius: 1,
              boxShadow: 'none',
              border: '1px solid #EEEEEE'
            }}>
              {/* 헤더 행 */}
              <Box sx={{ 
                display: 'grid',
                gridTemplateColumns: '1fr 2fr 2fr 100px 220px', // 마지막 컬럼 너비 증가
                gap: 2,
                pb: 2,
                borderBottom: '1px solid #EEEEEE'
              }}>
                <Typography sx={{ color: '#666' }}>이름</Typography>
                <Typography sx={{ color: '#666' }}>E-mail</Typography>
                <Typography sx={{ color: '#666' }}>연락처</Typography>
                <Typography sx={{ color: '#666' }}>서명 여부</Typography>
                <Typography sx={{ color: '#666' }}>문서</Typography>
              </Box>

              {/* 참여자 목록 */}
              {contract.participants.map((participant, index) => (
                <Box 
                  key={index}
                  sx={{ 
                    display: 'grid',
                    gridTemplateColumns: '1fr 2fr 2fr 100px 220px', // 마지막 컬럼 너비 증가
                    gap: 2,
                    py: 2,
                    borderBottom: index < contract.participants.length - 1 ? '1px solid #EEEEEE' : 'none',
                    alignItems: 'center'
                  }}
                >
                  <Typography>{participant.name}</Typography>
                  <Typography>{participant.email}</Typography>
                  <Typography>{participant.phoneNumber}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ 
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: participant.signed ? '#4CAF50' : '#666'
                    }} />
                    <Typography sx={{ color: participant.signed ? '#4CAF50' : '#666' }}>
                      {participant.signed ? '서명 완료' : '서명 대기'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {participant.signed ? (
                      // 서명 완료된 경우 다운로드 버튼 표시
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<DownloadIcon />}
                        onClick={() => handleDownloadAllSignedPdfs(participant.id)}
                        sx={{
                          borderColor: '#1976d2',
                          color: '#1976d2',
                          '&:hover': {
                            borderColor: '#1565c0',
                            backgroundColor: 'rgba(25, 118, 210, 0.04)'
                          },
                          borderRadius: '8px',
                          fontSize: '0.75rem'
                        }}
                      >
                        서명된 PDF 다운로드
                      </Button>
                    ) : (
                      // 서명 대기 중인 경우 서명하기 버튼 표시
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<DrawIcon />}
                        onClick={() => handleSignatureClick(participant)}
                        disabled={participant.signed}
                        sx={{
                          backgroundColor: '#1976d2',
                          '&:hover': {
                            backgroundColor: '#1565c0',
                          },
                          borderRadius: '8px',
                          fontSize: '0.8rem'
                        }}
                      >
                        현장서명
                      </Button>
                    )}
                  </Box>
                </Box>
              ))}
            </Paper>
          </Box>
        </Paper>
      </Box>
    </>
  );
};

export default ContractDetailPage; 