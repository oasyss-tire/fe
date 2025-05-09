import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Button,
} from '@mui/material';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { usePdf } from '../../contexts/PdfContext';
import PdfToolbar from './PdfToolbar';
import { TextField, SignatureField, CheckboxField, ConfirmTextField } from '../common/fields/PdfField';
import SaveTemplateModal from '../common/modals/SaveTemplateModal';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import ConfirmTextInputModal from '../common/fields/ConfirmTextInputModal';
import TextDescriptionModal from '../common/fields/TextDescriptionModal';

// PDF.js 워커 설정
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// 개선된 쓰로틀 함수
function throttle(func, delay) {
  let lastCall = 0;
  let lastArgs = null;
  let timeoutId = null;
  
  return function(...args) {
    const now = Date.now();
    lastArgs = args;
    
    // 딜레이 시간이 지났으면 즉시 실행
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    } else if (!timeoutId) {
      // 그렇지 않으면 남은 시간 후에 예약 실행
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        timeoutId = null;
        func(...lastArgs);
      }, delay - (now - lastCall));
    }
  };
}

// 백분율 값의 정밀도를 제한하는 헬퍼 함수 - 정밀도 높이기
const roundPrecision = (value, decimals = 6) => {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

const PdfViewerPage = ({ isEditMode = false }) => {
  const location = useLocation();
  const { 
    pdfFile, fileName, pdfId, savedFields, saveFields, contractId,
    pdfUrl  // pdfUrl 추가
  } = usePdf();
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfScale, setPdfScale] = useState(null);
  const containerRef = useRef(null);
  const [selectedTool, setSelectedTool] = useState(null);
  const [textFields, setTextFields] = useState([]);
  const [signatureFields, setSignatureFields] = useState([]);
  const [checkboxFields, setCheckboxFields] = useState([]);
  const [confirmTextFields, setConfirmTextFields] = useState([]);
  const [isPlacing, setIsPlacing] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragTarget, setDragTarget] = useState(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeTarget, setResizeTarget] = useState(null);
  const resizeStartPos = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const [pdfDimensions, setPdfDimensions] = useState({ width: 0, height: 0 });
  const [saveTemplateModalOpen, setSaveTemplateModalOpen] = useState(false);
  const [activeConfirmFieldId, setActiveConfirmFieldId] = useState(null);
  const [confirmTextModalOpen, setConfirmTextModalOpen] = useState(false);
  const [textDescriptionModalOpen, setTextDescriptionModalOpen] = useState(false);
  const [activeTextFieldId, setActiveTextFieldId] = useState(null);
  
  // A4 크기 상수 추가
  const PAGE_WIDTH = 595.28;  // A4 너비 (pt)
  const PAGE_HEIGHT = 841.89; // A4 높이 (pt)

  // 서명 필드 상태 변경 감지
  useEffect(() => {
    if (signatureFields.length > 0) {
      // 각 필드의 정사각형 여부 확인
      signatureFields.forEach(field => {

      });
    }
  }, [signatureFields]);
  
  // 체크박스 필드 상태 변경 감지
  useEffect(() => {
    if (checkboxFields.length > 0) {

      // 각 필드의 정사각형 여부 확인
      checkboxFields.forEach(field => {

      });
    }
  }, [checkboxFields]);

  // 이제 pdfFile을 우선적으로 사용하고, 없는 경우에만 pdfUrl 사용
  let fileUrl;
  if (pdfFile) {
    fileUrl = pdfFile;
  } else if (pdfUrl) {
    fileUrl = pdfUrl;
  } else {
    fileUrl = null;
  }

  // 컨테이너 크기 변경 감지 및 스케일 계산
  useEffect(() => {
    const calculateScale = () => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const style = window.getComputedStyle(container);
      const paddingX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
      const availableWidth = container.clientWidth - paddingX;

      // A4 크기 기준 (595.28pt x 841.89pt)
      const targetWidth = availableWidth * 0.9;
      const baseScale = targetWidth / 595.28;
      
      // 스케일 범위 제한
      const finalScale = Math.min(Math.max(baseScale, 0.8), 1.2);
      setPdfScale(finalScale);
    };

    // 초기 계산
    calculateScale();

    // 리사이즈 이벤트 리스너
    const resizeObserver = new ResizeObserver(calculateScale);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // PDF 문서 로드 성공 시 실행
  const handleDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    
    // PDF 원본 크기 저장
    const page = document.querySelector('.react-pdf__Page');
    if (page) {
      const viewport = page.firstChild;
      setPdfDimensions({
        width: viewport.width / pdfScale,  // scale 제거하여 원본 크기 구함
        height: viewport.height / pdfScale
      });
    }

    if (savedFields.length > 0) {
      // 텍스트와 confirmText 필드는 그대로 설정
      setTextFields(savedFields.filter(f => f.type === 'text'));
      setConfirmTextFields(savedFields.filter(f => f.type === 'confirmText'));
      
      // 서명 필드는 정사각형으로 변환하여 설정
      const signatureFieldsWithSquare = savedFields
        .filter(f => f.type === 'signature')
        .map(field => {
          const size = Math.max(field.relativeWidth, field.relativeHeight);
          return {
            ...field,
            relativeWidth: size,
            relativeHeight: size
          };
        });
      setSignatureFields(signatureFieldsWithSquare);
      
      // 체크박스 필드도 정사각형으로 변환하여 설정
      const checkboxFieldsWithSquare = savedFields
        .filter(f => f.type === 'checkbox')
        .map(field => {
          const size = Math.max(field.relativeWidth, field.relativeHeight);
          return {
            ...field,
            relativeWidth: size,
            relativeHeight: size
          };
        });
      setCheckboxFields(checkboxFieldsWithSquare);
    }
  };

  const handleToolChange = (event, newTool) => {
    if (selectedTool === newTool) {
      setSelectedTool(null);
      return;
    }

    setSelectedTool(newTool);
    if (newTool === 'text' || newTool === 'signature' || newTool === 'checkbox' || newTool === 'confirmText') {
      setIsPlacing(true);
    }
  };

  // 현재 화면에 보이는 페이지 찾기
  const findVisiblePage = () => {
    const container = containerRef.current;
    if (!container) return null;

    const containerRect = container.getBoundingClientRect();
    const pages = container.querySelectorAll('[id^="page-"]');
    
    for (const page of pages) {
      const pageRect = page.getBoundingClientRect();
      const isVisible = (
        pageRect.top >= containerRect.top - pageRect.height/2 &&
        pageRect.bottom <= containerRect.bottom + pageRect.height/2
      );
      //아 
      if (isVisible) {
        return page;
      }
    }

    return pages[0]; // 기본값으로 첫 페이지 반환
  };

  // 썸네일 클릭 시 해당 페이지로 스크롤
  const scrollToPage = (pageNumber) => {
    const pageElement = document.getElementById(`page-${pageNumber}`);
    if (pageElement) {
      pageElement.scrollIntoView({ behavior: 'smooth' });
    }
    setCurrentPage(pageNumber);
  };

  // 마우스 움직임 처리 (미리보기용)
  const handleMouseMove = throttle((e) => {
    if (!isPlacing) return;
    
    const pageElement = e.target.closest('.react-pdf__Page');
    if (!pageElement) {
      setMousePosition(null);
      return;
    }
    
    // 마우스 위치 저장 (고정 위치)
    setMousePosition({
      x: e.clientX,
      y: e.clientY
    });
  }, 16); // 약 60fps에 맞춰 16ms마다 실행

  // PDF 영역 클릭 시 필드 추가
  const handlePdfClick = (e) => {
    if (!isPlacing || !selectedTool) return;

    const pageElement = e.target.closest('.react-pdf__Page');
    if (!pageElement) return;

    const pageContainer = pageElement.closest('[id^="page-"]');
    if (!pageContainer) return;
    
    const pageNumber = parseInt(pageContainer.id.split('-')[1]);
    const pageRect = pageElement.getBoundingClientRect();
    
    // 마우스 위치를 페이지 기준 상대 좌표로 변환 (0~1 사이 값)
    const relativeX = (e.clientX - pageRect.left) / pageRect.width;
    const relativeY = (e.clientY - pageRect.top) / pageRect.height;
    
    // A4 비율 계산 (1:1.414)
    const aspectRatio = PAGE_HEIGHT / PAGE_WIDTH; // 약 1.414
    
    // 필드 타입에 따른 상대 크기 설정 (A4 비율 기준)
    let relativeWidth, relativeHeight;
    
    // 미리보기와 일치하는 표준 크기 설정
    const TEXT_FIELD_WIDTH = 0.18; // 페이지 너비의 17%로 축소 (약 80px와 동일한 비율)
    const TEXT_FIELD_HEIGHT = 0.025; // 페이지 높이의 2%로 변경 (최소 높이와 동일하게)
    
    if (selectedTool === 'checkbox') {
      relativeWidth = 0.03;
      // 정사각형이 되도록 높이 조정 (비율 반영)
      relativeHeight = relativeWidth / aspectRatio;
    } else if (selectedTool === 'signature') {
      relativeWidth = 0.1;
      // 정사각형이 되도록 높이 조정 (비율 반영)
      relativeHeight = relativeWidth / aspectRatio;
    } else if (selectedTool === 'confirmText') {
      relativeWidth = TEXT_FIELD_WIDTH; // 텍스트 필드와 동일한 너비 사용
      relativeHeight = TEXT_FIELD_HEIGHT; // 텍스트 필드와 동일한 높이 사용
    } else {
      // text 필드 - 미리보기 크기와 동일하게 설정
      relativeWidth = TEXT_FIELD_WIDTH; // 미리보기와 동일한 너비 비율
      relativeHeight = TEXT_FIELD_HEIGHT; // 미리보기와 동일한 높이 비율
    }


    const newField = {
      id: `${selectedTool}-${Date.now()}`,
      relativeX: relativeX,
      relativeY: relativeY,
      relativeWidth: relativeWidth,
      relativeHeight: relativeHeight,
      value: '',
      page: pageNumber,
      type: selectedTool
    };


    if (selectedTool === 'text') {
      setTextFields(prev => [...prev, newField]);
      setActiveTextFieldId(newField.id);
      setTextDescriptionModalOpen(true);
    } else if (selectedTool === 'signature') {
      setSignatureFields(prev => [...prev, newField]);
    } else if (selectedTool === 'checkbox') {
      setCheckboxFields(prev => [...prev, newField]);
    } else if (selectedTool === 'confirmText') {
      // confirmText 필드는 즉시 추가하고 빈 값으로 시작
      const confirmField = {
        ...newField,
        confirmText: '', // 관리자가 입력할 빈 값
        isEditMode: true // 관리자 모드 표시
      };
      
      // 그냥 바로 필드 추가
      setConfirmTextFields(prev => [...prev, confirmField]);
      
      // 생성 즉시 모달 열기
      setActiveConfirmFieldId(confirmField.id);
      setConfirmTextModalOpen(true);
    }

    setIsPlacing(false);
    setSelectedTool(null);
  };

  // 드래그 시작
  const handleDragStart = (e, fieldId) => {
    e.preventDefault();

    
    // 리액트 상태 업데이트
    setIsDragging(true);
    setDragTarget(fieldId);
    
    // 로컬 변수로 드래그 상태 추적 (클로저 활용)
    let isCurrentlyDragging = true;
    
    // 필드 찾기
    const allFields = [...textFields, ...signatureFields, ...checkboxFields, ...confirmTextFields];
    const targetField = allFields.find(f => f.id === fieldId);

    
    if (!targetField) {
      console.error('필드를 찾을 수 없음:', fieldId);
      return;
    }
    
    const fieldElement = document.getElementById(fieldId);
    if (!fieldElement) {
      console.error('필드 DOM 요소를 찾을 수 없음:', fieldId);
      return;
    }

    
    // 여기서 수정: 해당 필드의 페이지 번호로 페이지 요소 직접 찾기
    const pageElement = document.getElementById(`page-${targetField.page}`);
    if (!pageElement) {
      console.error('페이지 요소를 찾을 수 없음');
      return;
    }
    
    // 페이지 안의 실제 PDF 페이지 요소 찾기
    const pdfPageElement = pageElement.querySelector('.react-pdf__Page');
    if (!pdfPageElement) {
      console.error('PDF 페이지 요소를 찾을 수 없음');
      return;
    }

    
    const pageRect = pdfPageElement.getBoundingClientRect();
    const fieldRect = fieldElement.getBoundingClientRect();
    
    // 마우스와 필드의 오프셋 계산
    const offsetX = e.clientX - fieldRect.left;
    const offsetY = e.clientY - fieldRect.top;

    
    // 중요: document에 직접 이벤트 핸들러 할당 (key point)
    document.onmousemove = moveHandler;
    document.onmouseup = upHandler;
    
    // 드래그 중 핸들러
    function moveHandler(e) {
      // React 상태 대신 로컬 변수 사용
      if (!isCurrentlyDragging) {
        return;
      }
      
      // 현재 마우스 위치에서 오프셋 빼서 필드 위치 계산
      const fieldLeft = e.clientX - offsetX;
      const fieldTop = e.clientY - offsetY;
      
      // 디버깅 - 매 10번째 움직임마다만 로그 출력
      if (Math.random() < 0.1) {
      }
      
      // 페이지 기준 상대 좌표로 변환
      const newRelativeX = (fieldLeft - pageRect.left) / pageRect.width;
      const newRelativeY = (fieldTop - pageRect.top) / pageRect.height;
      
      // 페이지 경계 내로 제한
      const boundedX = Math.max(0, Math.min(1 - targetField.relativeWidth, newRelativeX));
      const boundedY = Math.max(0, Math.min(1 - targetField.relativeHeight, newRelativeY));
      
      // 디버깅
      if (Math.random() < 0.1) {
      }

      try {
        // 필드 타입에 따라 업데이트
        if (targetField.type === 'text' || fieldId.startsWith('text')) {
          setTextFields(prev => prev.map(f => 
            f.id === fieldId ? {...f, relativeX: boundedX, relativeY: boundedY} : f));
        } 
        else if (targetField.type === 'signature' || fieldId.startsWith('signature')) {
          // 서명 필드의 경우 너비와 높이를 동일하게 유지 (정사각형)
          const size = Math.max(targetField.relativeWidth, targetField.relativeHeight);
          setSignatureFields(prev => prev.map(f => 
            f.id === fieldId ? {...f, relativeX: boundedX, relativeY: boundedY, relativeWidth: size, relativeHeight: size} : f));
        }
        else if (targetField.type === 'checkbox' || fieldId.startsWith('checkbox')) {
          // 체크박스 필드의 경우 너비와 높이를 동일하게 유지 (정사각형)
          const size = Math.max(targetField.relativeWidth, targetField.relativeHeight);
          setCheckboxFields(prev => prev.map(f => 
            f.id === fieldId ? {...f, relativeX: boundedX, relativeY: boundedY, relativeWidth: size, relativeHeight: size} : f));
        }
        else if (targetField.type === 'confirmText' || fieldId.startsWith('confirmText')) {
          setConfirmTextFields(prev => prev.map(f => 
            f.id === fieldId ? {...f, relativeX: boundedX, relativeY: boundedY} : f));
        }
      } catch (err) {
        console.error('상태 업데이트 오류:', err);
      }
    }
    
    // 드래그 종료 핸들러
    function upHandler() {
      // 로컬 변수 업데이트
      isCurrentlyDragging = false;
      // 리액트 상태 업데이트
      setIsDragging(false);
      setDragTarget(null);
      
      // 이벤트 핸들러 제거
      document.onmousemove = null;
      document.onmouseup = null;
    }
  };

  // 리사이즈 시작
  const handleResizeStart = (e, fieldId) => {
    e.preventDefault();
    e.stopPropagation();
    
    
    // 리액트 상태 업데이트
    setIsResizing(true);
    setResizeTarget(fieldId);
    
    // 로컬 변수로 리사이즈 상태 추적 (클로저 활용)
    let isCurrentlyResizing = true;
    
    // 필드 찾기
    const allFields = [...textFields, ...signatureFields, ...confirmTextFields];
    const targetField = allFields.find(f => f.id === fieldId);
    
    
    if (!targetField) {
      console.error('리사이즈 필드를 찾을 수 없음:', fieldId);
      return;
    }
    
    // 필드와 페이지 요소 찾기
    const fieldElement = document.getElementById(fieldId);
    if (!fieldElement) {
      console.error('리사이즈 필드 DOM 요소를 찾을 수 없음:', fieldId);
      return;
    }

    
    // 여기서 수정: 해당 필드의 페이지 번호로 페이지 요소 직접 찾기
    const pageElement = document.getElementById(`page-${targetField.page}`);
    if (!pageElement) {
      console.error('리사이즈 페이지 요소를 찾을 수 없음');
      return;
    }
    
    // 페이지 안의 실제 PDF 페이지 요소 찾기
    const pdfPageElement = pageElement.querySelector('.react-pdf__Page');
    if (!pdfPageElement) {
      console.error('리사이즈 PDF 페이지 요소를 찾을 수 없음');
      return;
    }
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = targetField.relativeWidth;
    const startHeight = targetField.relativeHeight;
    const pageRect = pdfPageElement.getBoundingClientRect();
    
    // A4 비율 계산
    const aspectRatio = PAGE_HEIGHT / PAGE_WIDTH; // 약 1.414
    
    // 표준 필드 크기 상수 - 리사이징 시 사용하는 최소 크기
    const RESIZE_MIN_WIDTH = 0.03; // 최소 너비 더 축소 (5%로 변경)
    const RESIZE_MIN_HEIGHT = 0.025; // 최소 높이 축소 (프리뷰 높이 기준)
    
    // 중요: document에 직접 이벤트 핸들러 할당 (key point)
    document.onmousemove = moveHandler;
    document.onmouseup = upHandler;
    
    // 리사이즈 중 핸들러
    function moveHandler(e) {
      // React 상태 대신 로컬 변수 사용
      if (!isCurrentlyResizing) {
        return;
      }
      
      // 마우스 이동 거리
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      // 간헐적 디버깅
      if (Math.random() < 0.1) {
      }
      
      // 페이지 기준 상대적 크기 변화
      const deltaWidth = deltaX / pageRect.width;
      const deltaHeight = deltaY / pageRect.height;
      
      // 새 크기 계산
      let newWidth = Math.max(RESIZE_MIN_WIDTH, startWidth + deltaWidth); // 최소 너비 보장
      let newHeight = Math.max(RESIZE_MIN_HEIGHT, startHeight + deltaHeight); // 최소 높이 보장
      
      try {
        // 서명 필드는 정사각형으로 유지 (더 큰 값 기준으로 통일)
        if (targetField.type === 'signature' || fieldId.startsWith('signature')) {
          const size = Math.max(newWidth, newHeight);
          newWidth = size;
          newHeight = size / aspectRatio; // 화면상 정사각형을 위해 비율 적용
        }
        
        // confirmText 필드 최소 크기
        if (targetField.type === 'confirmText' || fieldId.startsWith('confirmText')) {
          newWidth = Math.max(RESIZE_MIN_WIDTH, newWidth); // 텍스트 필드와 동일한 최소 너비
          newHeight = Math.max(RESIZE_MIN_HEIGHT, newHeight); // 텍스트 필드와 동일한 최소 높이
        }
        
        // 텍스트 필드의 최소 높이 설정
        if (targetField.type === 'text' || fieldId.startsWith('text')) {
          newHeight = Math.max(RESIZE_MIN_HEIGHT, newHeight); // 텍스트 필드 최소 높이 일관성 유지
        }
        
        // 필드 타입에 따라 업데이트
        if (targetField.type === 'text' || fieldId.startsWith('text')) {
          setTextFields(prev => prev.map(f => 
            f.id === fieldId ? {...f, relativeWidth: newWidth, relativeHeight: newHeight} : f));
        } 
        else if (targetField.type === 'signature' || fieldId.startsWith('signature')) {
          setSignatureFields(prev => prev.map(f => 
            f.id === fieldId ? {...f, relativeWidth: newWidth, relativeHeight: newHeight} : f));
        }
        else if (targetField.type === 'confirmText' || fieldId.startsWith('confirmText')) {
          setConfirmTextFields(prev => prev.map(f => 
            f.id === fieldId ? {...f, relativeWidth: newWidth, relativeHeight: newHeight} : f));
        }
        // 체크박스는 여기에 없음 - 리사이즈 불가능
      } catch (err) {
        console.error('리사이즈 상태 업데이트 오류:', err);
      }
    }
    
    // 리사이즈 종료 핸들러
    function upHandler() {
      // 로컬 변수 업데이트
      isCurrentlyResizing = false;
      // 리액트 상태 업데이트
      setIsResizing(false);
      setResizeTarget(null);
      
      // 이벤트 핸들러 제거
      document.onmousemove = null;
      document.onmouseup = null;
    }
  };

  // 필드 삭제
  const handleDeleteField = (e, fieldId) => {
    e.stopPropagation();

    setTextFields(prev => prev.filter(field => field.id !== fieldId));
    setSignatureFields(prev => prev.filter(field => field.id !== fieldId));
    setCheckboxFields(prev => prev.filter(field => field.id !== fieldId));
    setConfirmTextFields(prev => prev.filter(field => field.id !== fieldId));
  };

  const handleSaveFields = async () => {
    try {

      
      const pdfPage = containerRef.current.querySelector('.react-pdf__Page');
      
      if (!pdfPage) {
        throw new Error('PDF 페이지를 찾을 수 없습니다.');
      }
      
      // 저장 전 빈 confirmText 필드 필터링 (관리자가 텍스트를 입력하지 않은 필드는 저장 안 함)
      const filteredConfirmTextFields = confirmTextFields.filter(field => field.confirmText?.trim() !== '');
      
      // A4 비율 계산 
      const aspectRatio = PAGE_HEIGHT / PAGE_WIDTH; // 약 1.414
      
      // 모든 필드 통합
      const allFields = [
        ...textFields,
        // 서명 필드는 정사각형으로 보이도록 높이 조정하여 저장
        ...signatureFields.map(field => ({
          ...field,
          relativeHeight: field.relativeWidth / aspectRatio // 화면에 보이는 것과 동일한 비율로 저장
        })),
        // 체크박스 필드도 정사각형으로 보이도록 높이 조정하여 저장
        ...checkboxFields.map(field => ({
          ...field,
          relativeHeight: field.relativeWidth / aspectRatio // 화면에 보이는 것과 동일한 비율로 저장
        })),
        ...filteredConfirmTextFields
      ].map(field => {
        // 상대 좌표 그대로 사용하여 API 요청 형식에 맞게 변환
        return {
          id: field.id,
          type: field.type,
          fieldName: `${field.type}${field.id.split('-')[1]}`,
          relativeX: field.relativeX,
          relativeY: field.relativeY,
          relativeWidth: field.relativeWidth,
          relativeHeight: field.relativeHeight,
          page: field.page || 1,
          value: field.value || '',
          // confirmText 필드 타입인 경우 confirmText 속성 추가
          ...(field.type === 'confirmText' ? { confirmText: field.confirmText } : {}),
          // description 속성이 있으면 추가
          ...(field.description ? { description: field.description } : {}),
          // formatCodeId 속성이 있으면 추가
          ...(field.formatCodeId ? { formatCodeId: field.formatCodeId } : {})
        };
      });

      
      // 필드 데이터를 API를 통해 저장
      await saveFields(allFields);
      
      
      // 편집 모드가 아닌 경우에만 템플릿 저장 모달 표시
      if (!isEditMode) {
        setSaveTemplateModalOpen(true);
      } else {
        // 편집 모드인 경우 성공 메시지 표시
        alert('템플릿이 성공적으로 수정되었습니다.');
      }

    } catch (error) {
      console.error('PDF 처리 중 오류:', error);
      alert('계약서 저장 중 오류가 발생했습니다.');
    }
  };

  const handleSaveTemplate = async ({ templateName, description }) => {
    try {
      const response = await fetch(`http://localhost:8080/api/contract-pdf/save-template/${pdfId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          templateName,
          description
        })
      });

      if (!response.ok) {
        throw new Error('템플릿 저장 실패');
      }

      alert('템플릿이 성공적으로 저장되었습니다.');
      setSaveTemplateModalOpen(false);
      window.location.href = '/contract-templates';

    } catch (error) {
      console.error('템플릿 저장 중 오류:', error);
      alert('템플릿 저장 중 오류가 발생했습니다.');
    }
  };

  // 저장된 필드 불러올 때
  const renderSavedFields = () => {
    // 백분율 기반으로 렌더링하므로 변환 필요 없음
    // 상대 좌표(relativeX, relativeY, relativeWidth, relativeHeight)를 그대로 사용
    return savedFields;
  };

  // 따라쓰기 모달 열기 함수
  const handleOpenConfirmTextModal = (fieldId) => {
    
    // activeConfirmFieldId가 이미 설정되어 있더라도 새로운 필드 ID로 업데이트
    setActiveConfirmFieldId(fieldId);
    
    // 해당 필드 찾기
    const field = confirmTextFields.find(f => f.id === fieldId);
    
    // 모달 열기
    setConfirmTextModalOpen(true);
  };

  const handleCloseConfirmTextModal = () => {
    setConfirmTextModalOpen(false);
    setActiveConfirmFieldId(null);
    
    // 모달이 닫힐 때 빈 confirmText가 있는 필드는 삭제
    setConfirmTextFields(prev => {
      const filtered = prev.filter(field => field.confirmText?.trim() !== '');
      return filtered;
    });
  };

  // 따라쓰기 텍스트 업데이트 함수 수정
  const handleConfirmTextInput = (fieldId, inputText) => {

    
    // 관리자 모드에서는 confirmText를 업데이트, 사용자 모드에서는 value를 업데이트
    setConfirmTextFields(prev => {
      const updatedFields = prev.map(field => {
        if (field.id === fieldId) {
          if (field.isEditMode) {

            // 관리자 모드: confirmText 업데이트
            return { ...field, confirmText: inputText };
          } else {
            // 사용자 모드: value 업데이트 (선택 옵션이 적용된 텍스트)
            return { ...field, value: inputText };
          }
        }
        return field;
      });
      
      return updatedFields;
    });
  };

  // 텍스트 필드 클릭 처리 함수 추가
  const handleTextFieldClick = (fieldId) => {

    setActiveTextFieldId(fieldId);
    setTextDescriptionModalOpen(true);
  };

  // 텍스트 필드 설명 저장 함수 수정
  const handleTextDescriptionSave = (description, formatCodeId) => {

    
    // 형식 이름을 가져오기 위한 API 호출
    const fetchFormatName = async (codeId) => {
      if (!codeId) return null;
      
      try {
        // 이미 선택한 형식 옵션 목록에서 해당 코드ID의 이름을 찾기
        const response = await fetch('http://localhost:8080/api/codes/field-formats');
        if (!response.ok) return null;
        
        const formats = await response.json();
        const format = formats.find(f => f.codeId === codeId);
        return format ? format.codeName : null;
      } catch (error) {
        console.error('형식 이름 조회 중 오류:', error);
        return null;
      }
    };
    
    // 텍스트 필드 업데이트
    const updateTextField = async () => {
      // 형식 ID가 있는 경우 형식 이름 조회
      let formatName = null;
      if (formatCodeId) {
        formatName = await fetchFormatName(formatCodeId);
      }
      
      setTextFields(prev => 
        prev.map(field => {
          if (field.id === activeTextFieldId) {
            return { 
              ...field, 
              description,
              formatCodeId,
              formatName
            };
          }
          return field;
        })
      );
    };
    
    updateTextField();
    setTextDescriptionModalOpen(false);
    setActiveTextFieldId(null);
  };

  if (!fileUrl) {
    console.error('PdfViewerPage - PDF 파일이 없습니다.', { fileName, pdfId });
    return (
      <Box sx={{ p: 3 }}>
        <Typography>PDF 파일을 찾을 수 없습니다.</Typography>
        {isEditMode && (
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            템플릿 수정 모드에서 PDF 파일을 로드하지 못했습니다. 관리자에게 문의하세요.
          </Typography>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh !important', bgcolor: '#f5f5f5' }}>
      {/* 왼쪽 썸네일 영역 - 고정 너비 */}
      <Box 
        sx={{ 
          width: '200px',
          minWidth: '200px',
          overflowY: 'auto',
          borderRight: '1px solid #ddd',
          bgcolor: '#fff',
          p: 1.5
        }}
      >
        <Typography variant="subtitle2" sx={{ mb: 2, pl: 1 }}>
          페이지 목록
        </Typography>
        <Document
          file={fileUrl}
          onLoadSuccess={handleDocumentLoadSuccess}
          loading={<Typography>로딩중...</Typography>}
        >
          {Array.from(new Array(numPages), (el, index) => (
            <Box 
              key={`thumb-${index + 1}`}
              sx={{ 
                mb: 1.5, 
                cursor: 'pointer',
                border: currentPage === index + 1 ? '2px solid #1976d2' : '1px solid #ddd',
                borderRadius: 1,
                overflow: 'hidden'
              }}
              onClick={() => scrollToPage(index + 1)}
            >
              <Page
                pageNumber={index + 1}
                width={140}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </Box>
          ))}
        </Document>
      </Box>

      {/* 가운데 PDF 뷰어 영역 - 남은 공간 모두 사용 */}
      <Box 
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onClick={handlePdfClick}
        sx={{ 
          flex: '1 1 auto',
          overflowY: 'scroll',
          maxHeight: '100vh',
          p: 4,
          bgcolor: '#fff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          cursor: isPlacing ? 
            (selectedTool === 'text' ? 'text' : 
             selectedTool === 'signature' ? 'cell' : 
             selectedTool === 'checkbox' ? 'pointer' : 
             selectedTool === 'confirmText' ? 'text' : 'default') 
            : 'default'
        }}
      >
        {/* 마우스 따라다니는 필드 프리뷰 */}
        {isPlacing && mousePosition && (
          <Box
            sx={{
              position: 'fixed',
              left: mousePosition.x,
              top: mousePosition.y,
              width: selectedTool === 'checkbox' ? '20px' : 
                     selectedTool === 'signature' ? '60px' :
                     selectedTool === 'confirmText' ? '80px' : '80px', // confirmText도 텍스트 필드와 동일한 너비
              height: selectedTool === 'checkbox' ? '20px' : 
                      selectedTool === 'signature' ? '60px' :
                      selectedTool === 'confirmText' ? '20px' : '20px', // confirmText도 텍스트 필드와 동일한 높이
              border: '1px dashed',
              borderColor: '#1976d2',
              backgroundColor: 'rgba(25, 118, 210, 0.1)',
              pointerEvents: 'none',
              zIndex: 1000,
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              ...(selectedTool === 'checkbox' || selectedTool === 'signature' ? { aspectRatio: '1/1' } : {})
            }}
          >
            {selectedTool === 'checkbox' && (
              <CheckBoxOutlineBlankIcon sx={{ fontSize: '16px', color: 'rgba(25, 118, 210, 0.6)' }} />
            )}
            {selectedTool === 'signature' && (
              <Typography variant="caption" sx={{ fontSize: '8px', color: 'rgba(25, 118, 210, 0.8)', p: 1 }}>
                서명
              </Typography>
            )}
            {selectedTool === 'confirmText' && (
              <Typography variant="caption" sx={{ fontSize: '8px', color: 'rgba(25, 118, 210, 0.8)', p: 1 }}>
                서명문구 필드
              </Typography>
            )}
            {selectedTool === 'text' && (
              <Typography variant="caption" sx={{ fontSize: '8px', color: 'rgba(25, 118, 210, 0.8)', p: 1 }}>
                텍스트 필드
              </Typography>
            )}
          </Box>
        )}

        <Typography variant="h6" sx={{ mb: 3, pl: 2 }}>
          {fileName}
        </Typography>
        <Document
          file={fileUrl}
          onLoadSuccess={handleDocumentLoadSuccess}
          loading={<Typography>PDF 로딩중...</Typography>}
        >
          {Array.from(new Array(numPages), (el, index) => (
            <Box 
              key={`page-${index + 1}`}
              id={`page-${index + 1}`}
              sx={{ 
                position: 'relative',
                mb: index === numPages - 1 ? 20 : 4, // 마지막 페이지인 경우 더 큰 마진 추가
                display: 'flex',
                justifyContent: 'center',
                boxShadow: '0 3px 6px rgba(0,0,0,0.1)',
                borderRadius: 2,
                overflow: 'hidden',
                bgcolor: '#fff',
                width: 'fit-content'
              }}
            >
              <Page
                pageNumber={index + 1}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                scale={pdfScale || 1}
              />
              
              {/* 해당 페이지의 텍스트 필드들 렌더링 */}
              {textFields
                .filter(field => field.page === index + 1)
                .map(field => (
                  <TextField
                    key={field.id}
                    field={field}
                    scale={pdfScale}
                    isDragging={isDragging}
                    dragTarget={dragTarget}
                    onDragStart={(e) => handleDragStart(e, field.id)}
                    onResizeStart={(e) => handleResizeStart(e, field.id)}
                    onDelete={(e) => handleDeleteField(e, field.id)}
                    onFieldClick={handleTextFieldClick}
                  />
                ))}

              {/* 서명 필드 렌더링 */}
              {signatureFields
                .filter(field => field.page === index + 1)
                .map(field => (
                  <SignatureField
                    key={field.id}
                    field={field}
                    scale={pdfScale}
                    isDragging={isDragging}
                    dragTarget={dragTarget}
                    onDragStart={(e) => handleDragStart(e, field.id)}
                    onResizeStart={(e) => handleResizeStart(e, field.id)}
                    onDelete={(e) => handleDeleteField(e, field.id)}
                  />
                ))}

              {/* 체크박스 필드 렌더링 */}
              {checkboxFields
                .filter(field => field.page === index + 1)
                .map(field => (
                  <CheckboxField
                    key={field.id}
                    field={field}
                    scale={pdfScale}
                    isDragging={isDragging}
                    dragTarget={dragTarget}
                    onDragStart={(e) => handleDragStart(e, field.id)}
                    onDelete={(e) => handleDeleteField(e, field.id)}
                  />
                ))}

              {/* 확인 텍스트 필드 렌더링 */}
              {confirmTextFields
                .filter(field => field.page === index + 1)
                .map(field => (
                  <ConfirmTextField
                    key={field.id}
                    field={field}
                    scale={pdfScale}
                    isDragging={isDragging}
                    dragTarget={dragTarget}
                    onDragStart={(e) => handleDragStart(e, field.id)}
                    onResizeStart={(e) => handleResizeStart(e, field.id)}
                    onDelete={(e) => handleDeleteField(e, field.id)}
                    onInputSave={(inputText) => handleConfirmTextInput(field.id, inputText)}
                    onFieldClick={() => {
                      handleOpenConfirmTextModal(field.id);
                    }}
                  />
                ))}
            </Box>
          ))}
        </Document>
      </Box>

      {/* 오른쪽 도구 선택 영역 */}
      <Box sx={{ 
        width: 280, 
        bgcolor: 'white', 
        borderLeft: 1, 
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}>
        {/* 상단 영역 */}
        <Box sx={{ p: 2, flex: 1 }}>
          <PdfToolbar 
            selectedTool={selectedTool}
            onToolChange={handleToolChange}
          />
        </Box>

        {/* 하단 버튼 영역 */}
        <Box sx={{ 
          p: 2, 
          borderTop: 1, 
          borderColor: 'divider'
        }}>
          <Button 
            variant="contained" 
            onClick={handleSaveFields}
            fullWidth
            sx={{ 
              py: 1.5,
              bgcolor: '#1976d2',
              '&:hover': {
                bgcolor: '#1565c0'
              }
            }}
          >
            {isEditMode ? '변경사항 저장' : '계약서 저장'}
          </Button>
        </Box>
      </Box>

      <SaveTemplateModal
        open={saveTemplateModalOpen}
        onClose={() => setSaveTemplateModalOpen(false)}
        onSave={handleSaveTemplate}
      />
      
      {/* 따라쓰기 입력 모달 */}
      <ConfirmTextInputModal
        open={confirmTextModalOpen}
        onClose={handleCloseConfirmTextModal}
        onSave={(inputText, extraData) => {

          if (activeConfirmFieldId) {
            handleConfirmTextInput(activeConfirmFieldId, inputText);
          }
          // 모달 닫기
          setConfirmTextModalOpen(false);
        }}
        onUpdate={(originalText) => {
          if (activeConfirmFieldId) {
            handleConfirmTextInput(activeConfirmFieldId, originalText);
          }
          // 모달 닫기
          setConfirmTextModalOpen(false);
        }}
        field={confirmTextFields.find(field => field.id === activeConfirmFieldId)}
      />
      
      {/* 텍스트 필드 설명 입력 모달 */}
      <TextDescriptionModal
        open={textDescriptionModalOpen}
        onClose={() => {
          setTextDescriptionModalOpen(false);
          setActiveTextFieldId(null);
        }}
        onSave={handleTextDescriptionSave}
        field={textFields.find(field => field.id === activeTextFieldId)}
      />
    </Box>
  );
};

export default PdfViewerPage;
