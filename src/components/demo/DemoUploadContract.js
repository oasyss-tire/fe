import React, { useState, useRef, useEffect } from "react";
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Stepper, 
  Step, 
  StepLabel,
  Paper,
  Grid,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Stack
} from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CreateIcon from '@mui/icons-material/Create';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import { useNavigate } from "react-router-dom";
import SignatureAreaSelector from "../contract/SignatureAreaSelector";
import { Document, Page } from 'react-pdf';

const DemoUploadContract = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [file, setFile] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [contractInfo, setContractInfo] = useState({
    title: "",
    description: "",
    expirationDate: "",
  });
  const [participants, setParticipants] = useState([
    { name: "", email: "", role: "서명자" }
  ]);
  const [selectedTool, setSelectedTool] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [inputAreas, setInputAreas] = useState([]);
  const containerRef = useRef(null);
  const [pdfWidth, setPdfWidth] = useState(0);
  const [pdfDimensions, setPdfDimensions] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);

  const steps = [
    '계약 정보 입력',
    '참여자 추가',
    'PDF 업로드',
    '서명 영역 지정'
  ];

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type === "application/pdf") {
      setFile(file);
      setPdfUrl(URL.createObjectURL(file));
    }
  };

  const handleAddParticipant = () => {
    setParticipants([...participants, { name: "", email: "", role: "서명자" }]);
  };

  const handleRemoveParticipant = (index) => {
    setParticipants(participants.filter((_, i) => i !== index));
  };

  const handleParticipantChange = (index, field, value) => {
    const newParticipants = [...participants];
    newParticipants[index][field] = value;
    setParticipants(newParticipants);
  };

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  // 입력 도구 선택
  const handleToolChange = (event, newTool) => {
    setSelectedTool(newTool);
  };

  // 마우스 위치 추적
  const handleMouseMove = (e) => {
    if (!containerRef.current || !selectedTool) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  // 영역 추가
  const handleClick = (e) => {
    if (!selectedTool || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newArea = {
      id: Date.now(),
      type: selectedTool,
      x,
      y
    };

    setInputAreas([...inputAreas, newArea]);
  };

  // 입력 도구별 가이드 영역 스타일
  const getGuideStyle = (type) => {
    const baseStyle = {
      position: 'absolute',
      left: mousePos.x,
      top: mousePos.y,
      pointerEvents: 'none',
      border: '2px dashed #1A237E',
      backgroundColor: 'rgba(26, 35, 126, 0.1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#1A237E',
      fontSize: '14px',
      fontWeight: '500'
    };

    switch (type) {
      case 'signature':
        return {
          ...baseStyle,
          width: pdfWidth * 0.15,
          height: pdfWidth * 0.06,
          transform: 'translate(-50%, -50%)'
        };
      case 'text':
        return {
          ...baseStyle,
          width: pdfWidth * 0.2,
          height: pdfWidth * 0.05,
          transform: 'translate(-50%, -50%)'
        };
      case 'checkbox':
        return {
          ...baseStyle,
          width: pdfWidth * 0.04,
          height: pdfWidth * 0.04,
          transform: 'translate(-50%, -50%)'
        };
      default:
        return {};
    }
  };

  // PDF 영역에 추가된 입력 영역 렌더링
  const renderInputArea = (area) => {
    const baseStyle = {
      position: 'absolute',
      left: area.x,
      top: area.y,
      border: '2px solid #1A237E',
      backgroundColor: 'rgba(26, 35, 126, 0.1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '12px'
    };

    switch (area.type) {
      case 'signature':
        return (
          <Box
            key={area.id}
            sx={{
              ...baseStyle,
              width: area.width,
              height: area.height,
              transform: `translate(-${area.width/2}px, -${area.height/2}px)`
            }}
          >
            서명/도장
          </Box>
        );
      case 'text':
        return (
          <Box
            key={area.id}
            sx={{
              ...baseStyle,
              width: area.width,
              height: area.height,
              transform: `translate(-${area.width/2}px, -${area.height/2}px)`
            }}

          >
            텍스트 입력
          </Box>
        );
      case 'checkbox':
        return (
          <Box
            key={area.id}
            sx={{
              ...baseStyle,
              width: area.width,
              height: area.height,
              transform: `translate(-${area.width/2}px, -${area.height/2}px)`
            }}

          >
            ☐
          </Box>
        );
      default:
        return null;
    }
  };

  // PDF 페이지 로드 성공 시 호출되는 함수
  const handlePageLoadSuccess = (page) => {
    const viewport = page.getViewport({ scale: 1 });
    const containerWidth = containerRef.current?.clientWidth || window.innerWidth;
    const containerPadding = 32;
    const availableWidth = containerWidth - containerPadding;
    
    // 최소 너비를 400px로 증가
    const minWidth = 400;
    const newWidth = Math.max(availableWidth, minWidth);
    
    // 스케일 최소값을 1.0으로 증가
    const newScale = Math.max(newWidth / viewport.width, 1.0);
    
    setPdfDimensions({
      width: viewport.width,
      height: viewport.height
    });
    setScale(newScale);
    setPdfWidth(newWidth);
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="계약서 제목"
              value={contractInfo.title}
              onChange={(e) => setContractInfo({...contractInfo, title: e.target.value})}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="계약서 설명"
              multiline
              rows={4}
              value={contractInfo.description}
              onChange={(e) => setContractInfo({...contractInfo, description: e.target.value})}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="만료일"
              type="date"
              value={contractInfo.expirationDate}
              onChange={(e) => setContractInfo({...contractInfo, expirationDate: e.target.value})}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        );

      case 1:
        return (
          <Box sx={{ mt: 2 }}>
            {participants.map((participant, index) => (
              <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
                <Grid item xs={5}>
                  <TextField
                    fullWidth
                    label="이름"
                    value={participant.name}
                    onChange={(e) => handleParticipantChange(index, "name", e.target.value)}
                  />
                </Grid>
                <Grid item xs={5}>
                  <TextField
                    fullWidth
                    label="이메일"
                    value={participant.email}
                    onChange={(e) => handleParticipantChange(index, "email", e.target.value)}
                  />
                </Grid>
                <Grid item xs={2}>
                  <IconButton 
                    onClick={() => handleRemoveParticipant(index)}
                    disabled={participants.length === 1}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Grid>
              </Grid>
            ))}
            <Button
              startIcon={<AddIcon />}
              onClick={handleAddParticipant}
              sx={{ mt: 1 }}
            >
              참여자 추가
            </Button>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              id="pdf-upload"
            />
            <label htmlFor="pdf-upload">
              <Button
                variant="outlined"
                component="span"
                sx={{ mb: 2 }}
              >
                PDF 파일 선택
              </Button>
            </label>
            {file && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                선택된 파일: {file.name}
              </Typography>
            )}
          </Box>
        );

      case 3:
        return (
          <Box sx={{ mt: 2 }}>
            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
              <ToggleButtonGroup
                value={selectedTool}
                exclusive
                onChange={handleToolChange}
                aria-label="input tool selection"
                size="small"
              >
                <ToggleButton value="signature" aria-label="signature">
                  <CreateIcon fontSize="small" /> 서명/도장
                </ToggleButton>
                <ToggleButton value="text" aria-label="text">
                  <TextFieldsIcon fontSize="small" /> 텍스트
                </ToggleButton>
                <ToggleButton value="checkbox" aria-label="checkbox">
                  <CheckBoxOutlineBlankIcon fontSize="small" /> 체크박스
                </ToggleButton>
              </ToggleButtonGroup>
            </Stack>

            <Box 
              ref={containerRef}
              sx={{ 
                position: 'relative',
                cursor: selectedTool ? 'crosshair' : 'default',
                width: '100%',
                overflow: 'hidden',
                touchAction: 'pinch-zoom',
                display: 'flex',
                justifyContent: 'center',
                p: 2
              }}
              onMouseMove={handleMouseMove}
              onClick={handleClick}
            >
              <Document 
                file={pdfUrl}
                loading={
                  <Box sx={{ textAlign: 'center', py: 2 }}>
                    <Typography>PDF 로딩중...</Typography>
                  </Box>
                }
              >
                <Page 
                  pageNumber={1} 
                  width={pdfWidth}
                  onLoadSuccess={handlePageLoadSuccess}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  loading={null}
                  scale={scale}
                />
              </Document>

              {/* 가이드 영역 크기 조정 */}
              {selectedTool && (
                <Box 
                  sx={{
                    ...getGuideStyle(selectedTool),
                    width: selectedTool === 'signature' ? pdfWidth * 0.15 : 
                           selectedTool === 'text' ? pdfWidth * 0.2 : 
                           pdfWidth * 0.04,
                    height: selectedTool === 'checkbox' ? pdfWidth * 0.04 : 
                           selectedTool === 'signature' ? pdfWidth * 0.06 :
                           pdfWidth * 0.05,
                    transform: `translate(-50%, -50%)`
                  }}
                >
                  {selectedTool === 'signature' && '서명/도장'}
                  {selectedTool === 'text' && '텍스트 입력'}
                  {selectedTool === 'checkbox' && '☐'}
                </Box>
              )}

              {/* 저장된 입력 영역들 크기 조정 */}
              {inputAreas.map(area => {
                const width = area.type === 'signature' ? pdfWidth * 0.15 :
                             area.type === 'text' ? pdfWidth * 0.2 :
                             pdfWidth * 0.04;
                const height = area.type === 'checkbox' ? pdfWidth * 0.04 : 
                               area.type === 'signature' ? pdfWidth * 0.06 :
                               pdfWidth * 0.05;
                
                return renderInputArea({
                  ...area,
                  width,
                  height
                });
              })}
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  // 완료 버튼 클릭 시 상태 전달
  const handleComplete = () => {
    navigate("/demo/contract-detail", {
      state: {
        contractInfo,
        participants,
        pdfUrl,
        inputAreas
      }
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" textAlign="center" sx={{ mb: 3 }}>
        📝 계약서 생성
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Paper sx={{ p: 3 }}>
        {renderStepContent(activeStep)}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button
            onClick={handleBack}
            disabled={activeStep === 0}
          >
            이전
          </Button>
          <Button
            variant="contained"
            onClick={activeStep === steps.length - 1 ? handleComplete : handleNext}
            sx={{ bgcolor: '#343959', '&:hover': { bgcolor: '#3d63b8' } }}
          >
            {activeStep === steps.length - 1 ? '완료' : '다음'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default DemoUploadContract;
