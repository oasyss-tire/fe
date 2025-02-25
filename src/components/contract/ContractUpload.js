import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Grid
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { ko } from 'date-fns/locale';
import { pdfjs } from 'react-pdf';
import { Document, Page } from 'react-pdf';
import SignatureAreaSelector from './SignatureAreaSelector';

// 계약 번호 자동 생성 함수를 컴포넌트 밖으로 이동
const generateContractNumber = () => {
  const randomNum = Math.floor(10000000 + Math.random() * 90000000); // 8자리 랜덤 숫자
  return `CT${randomNum}`;
};

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const ContractUpload = () => {
  const [formData, setFormData] = useState({
    title: '',
    contractType: '',
    description: '',
    // 위수탁자 정보
    contracteeName: '',
    contracteeEmail: '',
    contracteePhoneNumber: '',
    // 본사 정보
    contractorName: '',
    contractorEmail: '',
    contractorPhoneNumber: '',
    // 추가 필드
    expirationDate: null,
    contractNumber: generateContractNumber(), // 이제 문제없이 사용 가능
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pdfContent, setPdfContent] = useState(null);
  const [signatureAreas, setSignatureAreas] = useState([]);
  const [isSelectingArea, setIsSelectingArea] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);  // URL state 추가
  const [pdfAnalysis, setPdfAnalysis] = useState({
    text: [],        // 페이지별 텍스트 내용
    forms: [],       // 폼 필드 위치
    signatures: []   // 추천 서명 위치
  });
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();
  const containerRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // PDF 분석 함수
  const analyzePdf = async (file) => {
    const fileUrl = URL.createObjectURL(file);
    setPdfUrl(fileUrl);

    try {
      const pdf = await pdfjs.getDocument(fileUrl).promise;
      const numPages = pdf.numPages;
      const analysis = {
        text: [],
        forms: [],
        signatures: []
      };

      // 각 페이지 분석
      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        
        // 텍스트 내용 추출
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => ({
          text: item.str,
          x: item.transform[4],
          y: item.transform[5],
          width: item.width,
          height: item.height
        }));

        // "서명" 또는 관련 키워드가 있는 위치 찾기
        const signatureKeywords = ['서명', '날인', '인감', '사인'];
        const suggestedSignatureAreas = pageText
          .filter(item => 
            signatureKeywords.some(keyword => item.text.includes(keyword))
          )
          .map(item => ({
            pageNumber: i,
            x: item.x,
            y: item.y,
            width: 200,
            height: 100,
            type: 'signature',
            keyword: item.text
          }));

        analysis.text.push(pageText);
        analysis.signatures.push(...suggestedSignatureAreas);
      }

      setPdfAnalysis(analysis);
      return analysis;
    } catch (error) {
      console.error('PDF 분석 중 오류:', error);
      throw error;
    }
  };

  // PDF 로드 핸들러 수정
  const handlePdfLoad = async (file) => {
    try {
      setLoading(true);
      await analyzePdf(file);
      setFile(file);
    } catch (error) {
      alert('PDF 분석 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleAreaSelected = (newArea) => {
    setSignatureAreas(prev => [...prev, newArea]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      alert('PDF 파일을 선택해주세요.');
      return;
    }

    setLoading(true);
    try {
      const formDataToSend = new FormData();
      // 모든 필드 추가
      Object.keys(formData).forEach(key => {
        if (key === 'expirationDate' && formData[key]) {
          formDataToSend.append(key, formData[key].toISOString());
        } else {
          formDataToSend.append(key, formData[key]);
        }
      });
      formDataToSend.append('file', file);
      formDataToSend.append('signatureAreas', JSON.stringify(signatureAreas));

      const response = await fetch('http://localhost:8080/api/contracts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: formDataToSend
      });

      if (response.ok) {
        alert('계약서가 업로드되었습니다.');
        navigate('/contracts');
      } else {
        throw new Error('업로드 실패');
      }
    } catch (error) {
      alert('계약서 업로드에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 cleanup
  useEffect(() => {
    return () => {
      // 컴포넌트 언마운트 시 생성된 URL 해제
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
        <Typography variant="h6" sx={{ mb: 3 }}>
          계약서 업로드
        </Typography>
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            {/* 계약 기본 정보 */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="계약서 제목"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="계약 번호"
                name="contractNumber"
                value={formData.contractNumber}
                InputProps={{
                  readOnly: true,
                }}
                sx={{ 
                  '& .MuiInputBase-input.Mui-readOnly': {
                    backgroundColor: '#f5f5f5'
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>계약 종류</InputLabel>
                <Select
                  name="contractType"
                  value={formData.contractType}
                  onChange={handleChange}
                  label="계약 종류"
                >
                  <MenuItem value="WORK">근로 계약서</MenuItem>
                  <MenuItem value="SERVICE">용역 계약서</MenuItem>
                  <MenuItem value="LEASE">임대차 계약서</MenuItem>
                  <MenuItem value="OTHER">기타 계약서</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ko}>
                <DatePicker
                  label="계약 만료일"
                  value={formData.expirationDate}
                  onChange={(newValue) => {
                    setFormData(prev => ({
                      ...prev,
                      expirationDate: newValue
                    }));
                  }}
                  renderInput={(params) => (
                    <TextField {...params} fullWidth />
                  )}
                />
              </LocalizationProvider>
            </Grid>

            {/* 위수탁자 정보 */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                위수탁자 정보
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="위수탁자 이름"
                name="contracteeName"
                value={formData.contracteeName}
                onChange={handleChange}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="위수탁자 이메일"
                name="contracteeEmail"
                type="email"
                value={formData.contracteeEmail}
                onChange={handleChange}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="위수탁자 연락처"
                name="contracteePhoneNumber"
                value={formData.contracteePhoneNumber}
                onChange={handleChange}
                required
                placeholder="010-0000-0000"
              />
            </Grid>

            {/* 본사 정보 */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
              본사 정보
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="본사 이름"
                name="contractorName"
                value={formData.contractorName}
                onChange={handleChange}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="본사 이메일"
                name="contractorEmail"
                type="email"
                value={formData.contractorEmail}
                onChange={handleChange}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="본사 연락처"
                name="contractorPhoneNumber"
                value={formData.contractorPhoneNumber}
                onChange={handleChange}
                required
                placeholder="010-0000-0000"
              />
            </Grid>

            {/* 계약 설명 */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="계약 설명"
                name="description"
                value={formData.description}
                onChange={handleChange}
                multiline
                rows={4}
              />
            </Grid>

            {/* PDF 파일 업로드 섹션 */}
            <Grid item xs={12}>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                sx={{ mt: 2 }}
              >
                PDF 파일 선택
                <input
                  type="file"
                  hidden
                  accept=".pdf"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setFile(file);
                      handlePdfLoad(file);
                    }
                  }}
                />
              </Button>
              {file && (
                <Typography variant="body2" sx={{ mt: 1, color: 'success.main' }}>
                  선택된 파일: {file.name}
                </Typography>
              )}
            </Grid>

            {/* 서명 영역 선택 버튼 */}
            {pdfUrl && (
              <Grid item xs={12}>
                <Button
                  onClick={() => setIsSelectingArea(!isSelectingArea)}
                  variant="outlined"
                  color={isSelectingArea ? "secondary" : "primary"}
                  sx={{ mt: 2 }}
                >
                  {isSelectingArea ? "서명 영역 선택 완료" : "서명 영역 선택"}
                </Button>
              </Grid>
            )}

            {/* PDF 미리보기 및 서명 영역 선택 */}
            {pdfUrl && (
              <SignatureAreaSelector
                pdfUrl={pdfUrl}
                isSelectingArea={isSelectingArea}
                onAreaSelected={handleAreaSelected}
                currentPage={currentPage}
                totalPages={pdfAnalysis.text.length}
              />
            )}

            {/* 제출 버튼 */}
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
                sx={{ 
                  mt: 3,
                  bgcolor: '#343959',
                  '&:hover': { bgcolor: '#3d63b8' }
                }}
              >
                {loading ? <CircularProgress size={24} /> : '계약서 업로드'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default ContractUpload; 