import React, { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Box, Button, ToggleButtonGroup, ToggleButton, Stack, Typography, IconButton } from '@mui/material';
import CreateIcon from '@mui/icons-material/Create';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import DeleteIcon from '@mui/icons-material/Delete';

// PDF.js 워커 설정
pdfjs.GlobalWorkerOptions.workerSrc = 
  `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

function SignatureAreaSelector({ pdfUrl }) {
  const [selectedAreas, setSelectedAreas] = useState([]);
  const [draggedArea, setDraggedArea] = useState(null);
  const [resizingArea, setResizingArea] = useState(null);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [selectedTool, setSelectedTool] = useState(null);
  const [pdfDimensions, setPdfDimensions] = useState({
    width: 0,
    height: 0,
    scale: 1,
    originalWidth: 0,
    originalHeight: 0
  });
  
  const containerRef = useRef(null);

  // PDF 페이지 로드 성공 시 호출
  const handlePageLoadSuccess = (page) => {
    const viewport = page.getViewport({ scale: 1 });
    
    // 모바일 화면 전체 너비 사용 (430px)
    const containerWidth = 430;
    const containerPadding = 0; // 패딩 제거
    
    // 화면 너비에 맞게 scale 계산 (더 큰 scale 적용)
    const scale = (containerWidth / viewport.width) * 1.5; // 1.5배 크게
    
    const scaledWidth = viewport.width * scale;
    const scaledHeight = viewport.height * scale;
    
    setPdfDimensions({
      width: scaledWidth,
      height: scaledHeight,
      scale: scale,
      originalWidth: viewport.width,
      originalHeight: viewport.height
    });
  };

  // 드래그 시작
  const handleAreaMouseDown = (e, area) => {
    e.stopPropagation();
    if (resizingArea) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    setDraggedArea(area);
    setDragOffset({
      x: mouseX - area.x,
      y: mouseY - area.y
    });
  };

  // 드래그 중
  const handleMouseMove = (e) => {
    if (draggedArea && !resizingArea) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const newX = mouseX - dragOffset.x;
      const newY = mouseY - dragOffset.y;

      // PDF 영역 내로 제한
      const maxX = pdfDimensions.width - draggedArea.width;
      const maxY = pdfDimensions.height - draggedArea.height;
      
      const boundedX = Math.max(0, Math.min(newX, maxX));
      const boundedY = Math.max(0, Math.min(newY, maxY));

      setSelectedAreas(areas => areas.map(area => 
        area.id === draggedArea.id 
          ? { ...area, x: boundedX, y: boundedY }
          : area
      ));
    }

    if (resizingArea) {
      handleResize(e);
    }
  };

  // 드래그 종료
  const handleMouseUp = () => {
    setDraggedArea(null);
    setResizingArea(null);
    setDragOffset({ x: 0, y: 0 });
  };

  // 영역 삭제
  const handleDelete = (e, areaId) => {
    e.stopPropagation();
    setSelectedAreas(areas => areas.filter(area => area.id !== areaId));
  };

  // 리사이즈 핸들 클릭 이벤트 수정
  const handleResizeStart = (e, area, direction) => {
    e.stopPropagation();  // 이벤트 전파 중단
    e.preventDefault();   // 기본 동작 중단
    
    setResizingArea({ area, direction });
    setStartPos({ x: e.clientX, y: e.clientY });
  };

  // 리사이즈 중
  const handleResize = (e) => {
    if (!resizingArea) return;

    const { area, direction } = resizingArea;
    const dx = e.clientX - startPos.x;
    const dy = e.clientY - startPos.y;
    const limits = AREA_SIZES[area.type];

    setSelectedAreas(areas => areas.map(a => {
      if (a.id !== area.id) return a;

      let newWidth = a.width;
      let newHeight = a.height;
      let newX = a.x;
      let newY = a.y;

      // 우측 방향 리사이즈
      if (direction.includes('e')) {
        newWidth = Math.min(Math.max(a.width + dx, limits.minWidth), limits.maxWidth);
      }
      
      // 좌측 방향 리사이즈
      if (direction.includes('w')) {
        const proposedWidth = a.width - dx;
        if (proposedWidth >= limits.minWidth && proposedWidth <= limits.maxWidth) {
          newWidth = proposedWidth;
          newX = a.x + dx;
        }
      }
      
      // 하단 방향 리사이즈
      if (direction.includes('s')) {
        newHeight = Math.min(Math.max(a.height + dy, limits.minHeight), limits.maxHeight);
      }
      
      // 상단 방향 리사이즈
      if (direction.includes('n')) {
        const proposedHeight = a.height - dy;
        if (proposedHeight >= limits.minHeight && proposedHeight <= limits.maxHeight) {
          newHeight = proposedHeight;
          newY = a.y + dy;
        }
      }

      return { ...a, width: newWidth, height: newHeight, x: newX, y: newY };
    }));

    setStartPos({ x: e.clientX, y: e.clientY });
  };

  // 도구 선택 핸들러
  const handleToolChange = (event, newTool) => {
    setSelectedTool(newTool);
  };

  // 영역 크기 상수 정의 수정
  const AREA_SIZES = {
    signature: { 
      width: 90,    // 150 -> 100
      height: 30,    // 60 -> 40
      minWidth: 50,  // 100 -> 60
      maxWidth: 180, // 300 -> 200
      minHeight: 20, // 40 -> 30
      maxHeight: 70  // 120 -> 80
    },
    text: { 
      width: 110,    // 200 -> 120
      height: 20,    // 40 -> 30
      minWidth: 70,  // 100 -> 80
      maxWidth: 190, // 400 -> 200
      minHeight: 20, // 30 -> 25
      maxHeight: 50  // 100 -> 60
    },
    checkbox: { 
      width: 12,     // 20 -> 16
      height: 12,    // 20 -> 16
      minWidth: 12,  // 20 -> 16
      maxWidth: 16,  // 40 -> 24
      minHeight: 12, // 20 -> 16
      maxHeight: 16  // 40 -> 24
    }
  };

  // 컨테이너에 전역 mouseup 이벤트 리스너 추가
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setDraggedArea(null);
      setResizingArea(null);
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  // handleClick 수정
  const handleClick = (e) => {
    // 리사이즈나 드래그 직후의 클릭은 무시
    if (!selectedTool || !containerRef.current || draggedArea || resizingArea) return;
    
    // 영역이나 핸들 클릭 시 무시
    if (e.target.closest('.signature-area') || 
        e.target.closest('.resize-handle') || 
        e.target.closest('.delete-button')) {
      return;
    }

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const { width, height } = AREA_SIZES[selectedTool];
    
    const newArea = {
      id: Date.now(),
      type: selectedTool,
      x: x - width/2,
      y: y - height/2,
      width,
      height
    };
    
    setSelectedAreas([...selectedAreas, newArea]);
  };

  return (
    <Box sx={{ 
      width: '100%',  // 전체 너비 사용
      height: '100vh',  // 전체 높이 사용
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* 도구 선택 버튼 */}
      <Stack direction="row" spacing={1} sx={{ 
        p: 1, 
        borderBottom: '1px solid #eee',
        backgroundColor: '#fff',
        position: 'sticky',
        top: 0,
        zIndex: 2
      }}>
        <ToggleButtonGroup
          value={selectedTool}
          exclusive
          onChange={handleToolChange}
          aria-label="input tool selection"
          size="small"
        >
          <ToggleButton value="signature" aria-label="signature">
            <CreateIcon fontSize="small" sx={{ mr: 1 }} /> 서명/도장
          </ToggleButton>
          <ToggleButton value="text" aria-label="text">
            <TextFieldsIcon fontSize="small" sx={{ mr: 1 }} /> 텍스트
          </ToggleButton>
          <ToggleButton value="checkbox" aria-label="checkbox">
            <CheckBoxOutlineBlankIcon fontSize="small" sx={{ mr: 1 }} /> 체크박스
          </ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      {/* PDF 뷰어 컨테이너 */}
      <Box 
        ref={containerRef}
        sx={{ 
          position: 'relative',
          flex: 1,
          overflow: 'auto',  // 스크롤 가능하도록
          backgroundColor: '#f5f5f5', // 배경색 추가
          '& .react-pdf__Page': {
            backgroundColor: '#fff',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            margin: '0 auto'
          }
        }}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <Document 
          file={pdfUrl}
          loading={
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              p: 2 
            }}>
              PDF 로딩중...
            </Box>
          }
        >
          <Page 
            pageNumber={1} 
            width={pdfDimensions.width}
            onLoadSuccess={handlePageLoadSuccess}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            loading={null}
            scale={1} // 선명도 유지를 위해 scale 속성 추가
          />
        </Document>

        {selectedAreas.map(area => (
          <Box
            key={area.id}
            className="signature-area"
            onMouseDown={(e) => handleAreaMouseDown(e, area)}
            sx={{
              position: 'absolute',
              left: area.x,
              top: area.y,
              width: area.width,
              height: area.height,
              border: '2px solid #1A237E',
              backgroundColor: 'rgba(26, 35, 126, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              zIndex: 1,
              cursor: 'move',
              '&:hover .delete-button': {
                opacity: 1
              }
            }}
          >
            {/* 삭제 버튼 */}
            <IconButton
              className="delete-button"
              onClick={(e) => handleDelete(e, area.id)}
              sx={{
                position: 'absolute',
                top: -20,
                right: -20,
                padding: '4px',
                backgroundColor: 'white',
                opacity: 0,
                transition: 'opacity 0.2s',
                '&:hover': {
                  backgroundColor: '#ffebee'
                }
              }}
              size="small"
            >
              <DeleteIcon sx={{ fontSize: 16, color: '#d32f2f' }} />
            </IconButton>

            {/* 리사이즈 핸들 */}
            {['nw','n','ne','e','se','s','sw','w'].map(direction => (
              <Box
                key={direction}
                className="resize-handle"
                onMouseDown={(e) => handleResizeStart(e, area, direction)}
                sx={{
                  position: 'absolute',
                  width: 8,
                  height: 8,
                  backgroundColor: '#1A237E',
                  ...getResizeHandlePosition(direction),
                  cursor: getResizeCursor(direction),
                  '&:hover': {
                    transform: 'scale(1.2)'
                  }
                }}
              />
            ))}

            {area.type === 'signature' && '서명/도장'}
            {area.type === 'text' && '텍스트 입력'}
            {area.type === 'checkbox' && '☐'}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

// 리사이즈 핸들 위치 계산 함수
const getResizeHandlePosition = (direction) => {
  const positions = {
    n: { top: -4, left: '50%', transform: 'translateX(-50%)' },
    s: { bottom: -4, left: '50%', transform: 'translateX(-50%)' },
    e: { right: -4, top: '50%', transform: 'translateY(-50%)' },
    w: { left: -4, top: '50%', transform: 'translateY(-50%)' },
    nw: { top: -4, left: -4 },
    ne: { top: -4, right: -4 },
    se: { bottom: -4, right: -4 },
    sw: { bottom: -4, left: -4 }
  };
  return positions[direction];
};

// 리사이즈 커서 스타일 함수
const getResizeCursor = (direction) => {
  const cursors = {
    n: 'ns-resize',
    s: 'ns-resize',
    e: 'ew-resize',
    w: 'ew-resize',
    nw: 'nw-resize',
    ne: 'ne-resize',
    se: 'se-resize',
    sw: 'sw-resize'
  };
  return cursors[direction];
};

export default SignatureAreaSelector;
