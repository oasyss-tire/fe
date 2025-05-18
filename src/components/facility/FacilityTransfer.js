import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Grid,
  Select,
  MenuItem,
  IconButton,
  FormControl,
  TextField,
  Snackbar,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  FormHelperText,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Card,
  CardContent,
  Chip,
  CardMedia,
} from '@mui/material';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon,
  SwapHoriz as SwapHorizIcon,
  DeleteForever as DeleteForeverIcon,
  Search as SearchIcon,
  AddPhotoAlternate as AddPhotoAlternateIcon,
  Image as ImageIcon,
  MoreHoriz as MoreHorizIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import FacilityCompanySelectDialog from './FacilityCompanySelectDialog';
import FacilitySelectDialog from './FacilitySelectDialog';
import { useAuth } from '../../contexts/AuthContext';
import MoveForm from './TransferForm/MoveForm';
import DisposeForm from './TransferForm/DisposeForm';
import LostForm from './TransferForm/LostForm';
import MiscForm from './TransferForm/MiscForm';
import { format } from 'date-fns';

const FacilityTransfer = () => {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const isUserRole = authUser?.role === 'USER';
  
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processingFlag, setProcessingFlag] = useState(false); // 중복 처리 방지 플래그
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  
  // 작업 유형 (이동, 폐기, 분실, 기타)
  const [operationType, setOperationType] = useState('move'); // 'move', 'dispose', 'lost', 'misc'
  
  // 단일 폼 데이터
  const [formData, setFormData] = useState({
    sourceCompanyId: '', // 출발지 수탁업체 (이동용)
    sourceCompanyName: '', // 출발지 수탁업체명
    facilityId: '',      // 시설물 ID
    facilityName: '',    // 시설물명
    destinationCompanyId: '', // 목적지 수탁업체 (이동용)
    destinationCompanyName: '', // 목적지 수탁업체명
    companyId: '',       // 수탁업체 ID (폐기/분실/기타용)
    companyName: '',     // 수탁업체명 (폐기/분실/기타용)
    notes: '',           // 비고/사유
    reason: '',          // 기타 트랜잭션 사유 (기타용)
    locationCompanyId: '', // 분실 장소 (분실용)
    currentSourceCompanyId: '',
    currentSourceCompanyName: ''
  });
  
  // 선택된 시설물 목록 (다중 선택용)
  const [selectedFacilities, setSelectedFacilities] = useState([]);
  
  // 시설물 목록
  const [facilities, setFacilities] = useState([]);
  
  // 확인 다이얼로그
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: null
  });
  
  // 수탁업체 선택 다이얼로그 상태
  const [companyDialog, setCompanyDialog] = useState({
    open: false,
    type: '', // 'source', 'destination', 'company'
    title: '',
    excludeCompanyId: null
  });
  
  // 시설물 선택 다이얼로그 상태
  const [facilityDialog, setFacilityDialog] = useState({
    open: false,
    type: '', // 'move' 또는 'dispose'
    companyId: null
  });

  // 이미지 업로드 관련 상태 - 전역 이미지 관리에서 개별 시설물 이미지 관리로 변경
  // 이미지는 선택된 각 시설물에 직접 연결되도록 변경
  const [currentFacilityId, setCurrentFacilityId] = useState(null); // 현재 이미지 업로드 중인 시설물 ID
  const [imageUploadError, setImageUploadError] = useState('');
  const MAX_IMAGE_COUNT = 5;
  const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
  
  // USER 권한 사용자의 업체 정보 자동 설정
  useEffect(() => {
    const fetchUserCompany = async () => {
      // USER 권한이고 companyId가 있는 경우에만 실행
      if (isUserRole && authUser?.companyId) {
        try {
          // 사용자의 업체 정보 조회
          const response = await fetch(`http://localhost:8080/api/companies/${authUser.companyId}`, {
            headers: {
              'Authorization': `Bearer ${sessionStorage.getItem('token')}`
            }
          });
          
          if (!response.ok) {
            throw new Error('수탁업체 정보를 불러오는데 실패했습니다.');
          }
          
          const companyData = await response.json();
          
          // 출발지 수탁업체 정보 자동 설정
          setFormData(prev => ({
            ...prev,
            sourceCompanyId: String(companyData.id),
            sourceCompanyName: companyData.companyName || companyData.storeName,
            currentSourceCompanyId: String(companyData.id),
            currentSourceCompanyName: companyData.companyName || companyData.storeName
          }));
          
          // 폐기 작업을 위한 수탁업체 정보도 자동 설정
          if (operationType === 'dispose') {
            setFormData(prev => ({
              ...prev,
              companyId: String(companyData.id),
              companyName: companyData.companyName || companyData.storeName
            }));
          }
          
          // 시설물 목록 자동 조회
          await fetchFacilitiesByCompany(companyData.id);
          
        } catch (error) {
          console.error('사용자 업체 정보 조회 실패:', error);
          showSnackbar('사용자 업체 정보를 불러오는데 실패했습니다.', 'error');
        }
      }
    };
    
    fetchUserCompany();
  }, [authUser, isUserRole, operationType]);
  
  // 수탁업체 및 시설물 데이터 로딩
  useEffect(() => {
    fetchCompanies();
  }, []);

  // 작업 유형 변경 처리
  const handleOperationTypeChange = (e) => {
    setOperationType(e.target.value);
    // 작업 유형 변경 시 폼 데이터 초기화
    setFormData({
      sourceCompanyId: '',
      sourceCompanyName: '',
      facilityId: '',
      facilityName: '',
      destinationCompanyId: '',
      destinationCompanyName: '',
      companyId: '',
      companyName: '',
      notes: '',
      reason: '',
      locationCompanyId: '',
      currentSourceCompanyId: '',
      currentSourceCompanyName: ''
    });
    setSelectedFacilities([]);
    setFacilities([]);
    
    // 이미지 관련 상태도 초기화
    // 이미지 미리보기 URL 해제
    setCurrentFacilityId(null);
    setImageUploadError('');
    
    // USER 권한인 경우 작업 유형 변경 후 자동으로 업체 정보 다시 설정
    if (isUserRole && authUser?.companyId) {
      // setTimeout을 사용하여 다음 렌더링 사이클에서 실행되도록 함
      setTimeout(async () => {
        try {
          // 사용자의 업체 정보 조회
          const response = await fetch(`http://localhost:8080/api/companies/${authUser.companyId}`, {
            headers: {
              'Authorization': `Bearer ${sessionStorage.getItem('token')}`
            }
          });
          
          if (!response.ok) {
            throw new Error('수탁업체 정보를 불러오는데 실패했습니다.');
          }
          
          const companyData = await response.json();
          
          if (e.target.value === 'move') {
            // 이동 작업인 경우 출발지 수탁업체 정보 설정
            setFormData(prev => ({
              ...prev,
              sourceCompanyId: String(companyData.id),
              sourceCompanyName: companyData.companyName || companyData.storeName,
              currentSourceCompanyId: String(companyData.id),
              currentSourceCompanyName: companyData.companyName || companyData.storeName
            }));
          } else if (e.target.value === 'dispose' || e.target.value === 'lost' || e.target.value === 'misc') {
            // 폐기/분실/기타 작업인 경우 수탁업체 정보 설정
            setFormData(prev => ({
              ...prev,
              companyId: String(companyData.id),
              companyName: companyData.companyName || companyData.storeName
            }));
          }
          
          // 시설물 목록 자동 조회
          await fetchFacilitiesByCompany(companyData.id);
          
        } catch (error) {
          console.error('사용자 업체 정보 조회 실패:', error);
          showSnackbar('사용자 업체 정보를 불러오는데 실패했습니다.', 'error');
        }
      }, 0);
    }
  };

  // 수탁업체 목록 조회
  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/companies', {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('수탁업체 목록을 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      setCompanies(data);
    } catch (error) {
      console.error('수탁업체 목록 조회 실패:', error);
      showSnackbar('수탁업체 목록을 불러오는데 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 특정 수탁업체 시설물 목록 조회
  const fetchFacilitiesByCompany = async (companyId) => {
    if (!companyId) {
      console.error('유효하지 않은 수탁업체 ID:', companyId);
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8080/api/facilities?companyId=${companyId}`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('시설물 목록을 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      
      // 폐기 상태가 아닌 시설물만 필터링 (statusCode가 "002003_0003"(폐기중) 또는 "002003_0004"(폐기완료)가 아닌 것만 포함)
      const availableFacilities = (data.content || []).filter(facility => {
        return facility.statusCode !== "002003_0003" && facility.statusCode !== "002003_0004";
      });
      
      setFacilities(availableFacilities);
    } catch (error) {
      console.error('시설물 목록 조회 실패:', error);
      showSnackbar('시설물 목록을 불러오는데 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 폼 데이터 변경 처리
  const handleChange = async (e) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: value
    });
    
    // 시설물 선택 시 시설물명 설정
    if (name === 'facilityId' && value) {
      const selectedFacility = facilities.find(facility => String(facility.facilityId) === String(value));
      if (selectedFacility) {
        setFormData(prev => ({
          ...prev,
          [name]: value,
          facilityName: `${selectedFacility.facilityTypeName} / ${selectedFacility.managementNumber}`
        }));
      }
    }
  };
  
  // 수탁업체 선택 다이얼로그 열기
  const handleOpenCompanyDialog = (type) => {
    // USER 권한이고 출발지 수탁업체 선택인 경우 차단
    if (isUserRole && type === 'source') {
      showSnackbar('사용자 권한으로는 출발지 수탁업체를 변경할 수 없습니다.', 'warning');
      return;
    }
    
    // USER 권한이고 폐기용 수탁업체 선택인 경우 차단
    if (isUserRole && type === 'company') {
      showSnackbar('사용자 권한으로는 폐기 대상 수탁업체를 변경할 수 없습니다.', 'warning');
      return;
    }
    
    let title = '';
    let excludeCompanyId = null;
    
    if (type === 'source') {
      title = '출발지 수탁업체 선택';
    } else if (type === 'destination') {
      title = '목적지 수탁업체 선택';
      excludeCompanyId = formData.sourceCompanyId; // 출발지와 같은 수탁업체는 선택 불가
    } else { // 'company' (폐기용)
      title = '수탁업체 선택';
    }
    
    setCompanyDialog({
      open: true,
      type,
      title,
      excludeCompanyId
    });
  };
  
  // 수탁업체 선택 다이얼로그 닫기
  const handleCloseCompanyDialog = () => {
    setCompanyDialog({
      ...companyDialog,
      open: false
    });
  };
  
  // 수탁업체 선택 처리
  const handleSelectCompany = async (company) => {
    const { type } = companyDialog;
    
    if (type === 'source') {
      setFormData(prev => ({
        ...prev,
        sourceCompanyId: String(company.id),
        sourceCompanyName: company.companyName,
        facilityId: '',
        facilityName: '',
        currentSourceCompanyId: String(company.id),
        currentSourceCompanyName: company.companyName
      }));
      await fetchFacilitiesByCompany(company.id);
      
      // 출발지 수탁업체 변경 시 시설물 목록을 초기화하지 않음
      // 대신 현재 선택된 수탁업체 정보를 임시 저장
    } else if (type === 'destination') {
      setFormData(prev => ({
        ...prev,
        destinationCompanyId: String(company.id),
        destinationCompanyName: company.companyName,
        currentDestinationCompanyId: String(company.id),
        currentDestinationCompanyName: company.companyName
      }));
      
      // 목적지 수탁업체가 변경되면 선택된 시설물의 목적지 정보는 업데이트하지 않음
      // 각 시설물은 자신의 출발지/목적지 정보를 유지
    } else { // 'company' (폐기용)
      setFormData(prev => ({
        ...prev,
        companyId: String(company.id),
        companyName: company.companyName,
        facilityId: '',
        facilityName: ''
      }));
      await fetchFacilitiesByCompany(company.id);
      
      // 수탁업체가 변경되면 선택된 시설물 목록 초기화
      setSelectedFacilities([]);
    }
    
    handleCloseCompanyDialog();
  };

  // 시설물 선택 다이얼로그 열기
  const handleOpenFacilityDialog = (type) => {
    let companyId = null;
    
    if (type === 'move') {
      if (!formData.currentSourceCompanyId) {
        showSnackbar('출발지 수탁업체를 먼저 선택해주세요.', 'warning');
        return;
      }
      
      if (!formData.currentDestinationCompanyId) {
        showSnackbar('목적지 수탁업체를 먼저 선택해주세요.', 'warning');
        return;
      }
      companyId = formData.currentSourceCompanyId;
    } else { // 'dispose'
      if (!formData.companyId) {
        showSnackbar('수탁업체를 먼저 선택해주세요.', 'warning');
        return;
      }
      companyId = formData.companyId;
    }
    
    setFacilityDialog({
      open: true,
      type,
      companyId
    });
  };
  
  // 시설물 선택 다이얼로그 닫기
  const handleCloseFacilityDialog = () => {
    setFacilityDialog({
      ...facilityDialog,
      open: false
    });
  };
  
  // 시설물 선택 처리
  const handleSelectFacility = (selectedItems) => {
    // 여러 시설물 선택 처리
    if (facilityDialog.type === 'move') {
      // 선택된 시설물 목록에 추가 (이동 정보 포함)
      const newFacilities = selectedItems.map(facility => ({
        facilityId: facility.facilityId,
        facilityTypeName: facility.facilityTypeName,
        managementNumber: facility.managementNumber,
        statusName: facility.statusName,
        // 이동 정보 추가 - 현재 선택된 출발지/목적지 사용
        sourceCompanyId: formData.currentSourceCompanyId,
        sourceCompanyName: formData.currentSourceCompanyName,
        destinationCompanyId: formData.currentDestinationCompanyId,
        destinationCompanyName: formData.currentDestinationCompanyName,
        // 이미지 관련 정보 추가
        images: [],
        previewUrls: []
      }));
      
      setSelectedFacilities(prev => [...prev, ...newFacilities]);
      
      // 단일 시설물 처리를 위한 폼 데이터에도 설정 (첫 번째 선택된 시설물)
      if (selectedItems.length > 0) {
        const firstFacility = selectedItems[0];
        setFormData(prev => ({
          ...prev,
          facilityId: String(firstFacility.facilityId),
          facilityName: `${firstFacility.facilityTypeName} / ${firstFacility.managementNumber}`
        }));
      }
    } else { // 'dispose'
      // 선택된 시설물 목록에 추가
      const newFacilities = selectedItems.map(facility => ({
        facilityId: facility.facilityId,
        facilityTypeName: facility.facilityTypeName,
        managementNumber: facility.managementNumber,
        statusName: facility.statusName,
        // 이미지 관련 정보 추가
        images: [],
        previewUrls: []
      }));
      
      setSelectedFacilities(prev => [...prev, ...newFacilities]);
      
      // 단일 시설물 처리를 위한 폼 데이터에도 설정 (첫 번째 선택된 시설물)
      if (selectedItems.length > 0) {
        const firstFacility = selectedItems[0];
        setFormData(prev => ({
          ...prev,
          facilityId: String(firstFacility.facilityId),
          facilityName: `${firstFacility.facilityTypeName} / ${firstFacility.managementNumber}`
        }));
      }
    }
    
    handleCloseFacilityDialog();
  };
  
  // 선택된 시설물 제거
  const handleRemoveFacility = (facilityId) => {
    setSelectedFacilities(prev => 
      prev.filter(item => String(item.facilityId) !== String(facilityId))
    );
    
    // 만약 현재 폼 데이터의 facilityId와 같다면 폼 데이터도 초기화
    if (String(formData.facilityId) === String(facilityId)) {
      setFormData(prev => ({
        ...prev,
        facilityId: '',
        facilityName: ''
      }));
    }
  };
  
  // 시설물 추가 버튼 클릭 핸들러
  const handleAddFacility = () => {
    if (operationType === 'move') {
      if (!formData.currentSourceCompanyId) {
        showSnackbar('출발지 수탁업체를 먼저 선택해주세요.', 'warning');
        return;
      }
      
      if (!formData.currentDestinationCompanyId) {
        showSnackbar('목적지 수탁업체를 먼저 선택해주세요.', 'warning');
        return;
      }
    } else if (operationType === 'dispose' && !formData.companyId) {
      showSnackbar('수탁업체를 먼저 선택해주세요.', 'warning');
      return;
    }
    
    handleOpenFacilityDialog(operationType);
  };
  
  // 폼 제출 처리
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 필수 필드 검증
    if (operationType === 'move') {
      if (!formData.sourceCompanyId || selectedFacilities.length === 0 || !formData.destinationCompanyId) {
        showSnackbar('출발지 수탁업체, 시설물, 목적지 수탁업체를 모두 선택해주세요.', 'warning');
        return;
      }
      
      // 출발지와 목적지가 같은 경우 처리
      if (formData.sourceCompanyId === formData.destinationCompanyId) {
        showSnackbar('출발지와 목적지 수탁업체가 동일합니다. 다른 수탁업체를 선택해주세요.', 'warning');
        return;
      }
    } else if (operationType === 'dispose') { 
      // 폐기
      if (!formData.companyId || selectedFacilities.length === 0) {
        showSnackbar('수탁업체와 시설물을 선택해주세요.', 'warning');
        return;
      }
    } else if (operationType === 'lost') { 
      // 분실
      if (!formData.companyId || selectedFacilities.length === 0) {
        showSnackbar('분실 업체와 시설물을 선택해주세요.', 'warning');
        return;
      }
    } else if (operationType === 'misc') { 
      // 기타
      if (!formData.companyId || selectedFacilities.length === 0 || !formData.reason) {
        showSnackbar('수탁 업체, 시설물, 트랜잭션 사유를 모두 선택해주세요.', 'warning');
        return;
      }
    }
    
    // 확인 다이얼로그 표시
    if (operationType === 'move') {
      setConfirmDialog({
        open: true,
        title: '시설물 이동 확인',
        message: `선택한 ${selectedFacilities.length}개의 시설물을 이동하시겠습니까?`,
        onConfirm: confirmTransfer
      });
    } else if (operationType === 'dispose') {
      setConfirmDialog({
        open: true,
        title: '시설물 폐기 확인',
        message: `선택한 ${selectedFacilities.length}개의 시설물을 폐기하시겠습니까? 이 작업은 되돌릴 수 없습니다.`,
        onConfirm: confirmDisposal
      });
    } else if (operationType === 'lost') {
      setConfirmDialog({
        open: true,
        title: '시설물 분실 확인',
        message: `선택한 ${selectedFacilities.length}개의 시설물을 분실 처리하시겠습니까?`,
        onConfirm: confirmLost
      });
    } else if (operationType === 'misc') {
      setConfirmDialog({
        open: true,
        title: '기타 트랜잭션 확인',
        message: `선택한 ${selectedFacilities.length}개의 시설물에 대한 기타 트랜잭션을 처리하시겠습니까?`,
        onConfirm: confirmMisc
      });
    }
  };

  // 이동 확인 처리
  const confirmTransfer = async () => {
    if (processingFlag) return;
    setProcessingFlag(true);
    // 즉시 다이얼로그 닫기
    setConfirmDialog({ ...confirmDialog, open: false });
    setLoading(true);
    try {
      // notes 값 추출
      const notes = formData.notes || '시설물 이동/폐기 관리 화면에서 이동 처리됨';
      
      // 순차적으로 처리 (한 번에 하나씩)
      let successCount = 0;
      let failedFacilities = [];
      
      for (const facility of selectedFacilities) {
        try {
          // 이동 전에 시설물 상태 재확인
          const facilityResponse = await fetch(`http://localhost:8080/api/facilities/${facility.facilityId}`, {
            headers: {
              'Authorization': `Bearer ${sessionStorage.getItem('token')}`
            }
          });
          
          if (!facilityResponse.ok) {
            throw new Error(`시설물 정보 조회 실패 (ID: ${facility.facilityId})`);
          }
          
          const facilityData = await facilityResponse.json();
          // 폐기 상태 확인 ("002003_0003": 폐기중, "002003_0004": 폐기완료)
          if (facilityData.statusCode === "002003_0003" || facilityData.statusCode === "002003_0004") {
            throw new Error(`이미 폐기 처리된 시설물은 이동할 수 없습니다 (ID: ${facility.facilityId}, ${facilityData.facilityTypeName})`);
          }
          
          let response;
          
          // 이미지가 있는 경우 multipart/form-data로 전송
          if (facility.images && facility.images.length > 0) {
            const formDataObj = new FormData();
            
            // 이동 요청 정보를 JSON 문자열로 변환하여 추가
            const moveRequest = {
              facilityId: facility.facilityId,
              fromCompanyId: facility.sourceCompanyId,
              toCompanyId: facility.destinationCompanyId,
              notes: notes
            };
            
            // JSON 객체를 문자열로 변환하여 request 파라미터로 추가
            formDataObj.append('request', JSON.stringify(moveRequest));
            
            // 해당 시설물에 연결된 이미지 파일들 추가
            for (const image of facility.images) {
              formDataObj.append('images', image);
            }
            
            // 이미지 첨부 지원 API 호출
            response = await fetch('http://localhost:8080/api/facility-transactions/move-with-images', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('token')}`
              },
              body: formDataObj
            });
          } else {
            // 기존 API 호출 (이미지 없는 경우)
            response = await fetch('http://localhost:8080/api/facility-transactions/move', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionStorage.getItem('token')}`
              },
              body: JSON.stringify({
                facilityId: facility.facilityId,
                fromCompanyId: facility.sourceCompanyId,
                toCompanyId: facility.destinationCompanyId,
                notes: notes
              })
            });
          }
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `시설물 (ID: ${facility.facilityId}) 이동 처리 중 오류가 발생했습니다.`);
          }
          
          // 각 시설물 처리 후 0.5초 지연 (서버 부하 방지 및 중복 생성 방지)
          await new Promise(resolve => setTimeout(resolve, 500));
          successCount++;
        } catch (error) {
          console.error(`시설물 (${facility.facilityTypeName} / ${facility.managementNumber}) 이동 실패:`, error);
          failedFacilities.push({
            ...facility,
            errorMessage: error.message
          });
        }
      }
      
      if (successCount > 0) {
        showSnackbar(`${successCount}개의 시설물 이동이 성공적으로 처리되었습니다.${failedFacilities.length > 0 ? ' 일부 시설물은 처리에 실패했습니다.' : ''}`, 'success');
        
        // 이미지 관련 상태 초기화
        setCurrentFacilityId(null);
        setImageUploadError('');
      }
      
      if (failedFacilities.length > 0) {
        console.error('이동 실패한 시설물:', failedFacilities);
        // 실패한 시설물만 남기고 성공한 것은 제거
        
        // 미리보기 URL 해제
        const successFacilities = selectedFacilities.filter(
          facility => !failedFacilities.some(
            failedFacility => String(failedFacility.facilityId) === String(facility.facilityId)
          )
        );
        
        successFacilities.forEach(facility => {
          facility.previewUrls.forEach(url => URL.revokeObjectURL(url));
        });
        
        setSelectedFacilities(failedFacilities);
      } else {
        // 모두 성공하면 초기화
        
        // 미리보기 URL 해제
        selectedFacilities.forEach(facility => {
          facility.previewUrls.forEach(url => URL.revokeObjectURL(url));
        });
        
        setFormData({
          sourceCompanyId: '',
          sourceCompanyName: '',
          facilityId: '',
          facilityName: '',
          destinationCompanyId: '',
          destinationCompanyName: '',
          companyId: '',
          companyName: '',
          notes: '',
          reason: '',
          locationCompanyId: '',
          currentSourceCompanyId: '',
          currentSourceCompanyName: ''
        });
        setSelectedFacilities([]);
        setFacilities([]);
      }
    } catch (error) {
      console.error('시설물 이동 처리 중 오류 발생:', error);
      showSnackbar(error.message || '시설물 이동 처리 중 오류가 발생했습니다.', 'error');
    } finally {
      setLoading(false);
      setProcessingFlag(false);
    }
  };

  // 폐기 확인 처리
  const confirmDisposal = async () => {
    if (processingFlag) return;
    setProcessingFlag(true);
    // 즉시 다이얼로그 닫기
    setConfirmDialog({ ...confirmDialog, open: false });
    setLoading(true);
    try {
      // notes 값 추출
      const notes = formData.notes || '시설물 이동/폐기 관리 화면에서 폐기 처리됨';
      
      // 순차적으로 처리 (한 번에 하나씩)
      let successCount = 0;
      let failedFacilities = [];
      
      for (const facility of selectedFacilities) {
        try {
          // 이미지가 있는 경우 multipart/form-data로 전송, 없는 경우 기존 API 사용
          let response;
          
          if (facility.images && facility.images.length > 0) {
            // 폼 데이터 생성
            const formDataObj = new FormData();
            
            // 폐기 요청 정보를 JSON으로 변환하여 추가
            const disposeRequest = {
              facilityId: facility.facilityId,
              notes: notes
            };
            
            // JSON 객체를 문자열로 변환하여 request 파라미터로 추가
            formDataObj.append('request', JSON.stringify(disposeRequest));
            
            // 해당 시설물에 연결된 이미지 파일들 추가
            for (const image of facility.images) {
              formDataObj.append('images', image);
            }
            
            // 이미지 첨부 지원 API 호출
            response = await fetch('http://localhost:8080/api/facility-transactions/dispose-with-images', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('token')}`
              },
              body: formDataObj
            });
          } else {
            // 기존 API 호출 (이미지 없는 경우)
            response = await fetch('http://localhost:8080/api/facility-transactions/dispose', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionStorage.getItem('token')}`
              },
              body: JSON.stringify({
                facilityId: facility.facilityId,
                notes: notes
              })
            });
          }
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `시설물 (ID: ${facility.facilityId}) 폐기 처리 중 오류가 발생했습니다.`);
          }
          
          // 각 시설물 처리 후 0.5초 지연 (서버 부하 방지 및 중복 생성 방지)
          await new Promise(resolve => setTimeout(resolve, 500));
          successCount++;
        } catch (error) {
          console.error(`시설물 (${facility.facilityTypeName} / ${facility.managementNumber}) 폐기 실패:`, error);
          failedFacilities.push({
            ...facility,
            errorMessage: error.message
          });
        }
      }
      
      if (successCount > 0) {
        showSnackbar(`${successCount}개의 시설물 폐기가 성공적으로 처리되었습니다.${failedFacilities.length > 0 ? ' 일부 시설물은 처리에 실패했습니다.' : ''}`, 'success');
        
        // 이미지 관련 상태 초기화
        setCurrentFacilityId(null);
        setImageUploadError('');
      }
      
      if (failedFacilities.length > 0) {
        console.error('폐기 실패한 시설물:', failedFacilities);
        // 실패한 시설물만 남기고 성공한 것은 제거
        
        // 미리보기 URL 해제
        const successFacilities = selectedFacilities.filter(
          facility => !failedFacilities.some(
            failedFacility => String(failedFacility.facilityId) === String(facility.facilityId)
          )
        );
        
        successFacilities.forEach(facility => {
          facility.previewUrls.forEach(url => URL.revokeObjectURL(url));
        });
        
        setSelectedFacilities(failedFacilities);
      } else {
        // 모두 성공하면 초기화
        
        // 미리보기 URL 해제
        selectedFacilities.forEach(facility => {
          facility.previewUrls.forEach(url => URL.revokeObjectURL(url));
        });
        
        setFormData({
          sourceCompanyId: '',
          sourceCompanyName: '',
          facilityId: '',
          facilityName: '',
          destinationCompanyId: '',
          destinationCompanyName: '',
          companyId: '',
          companyName: '',
          notes: '',
          reason: '',
          locationCompanyId: '',
          currentSourceCompanyId: '',
          currentSourceCompanyName: ''
        });
        setSelectedFacilities([]);
        setFacilities([]);
      }
    } catch (error) {
      console.error('시설물 폐기 처리 중 오류 발생:', error);
      showSnackbar(error.message || '시설물 폐기 처리 중 오류가 발생했습니다.', 'error');
    } finally {
      setLoading(false);
      setProcessingFlag(false);
    }
  };

  // 분실 확인 처리 함수 추가
  const confirmLost = async () => {
    if (processingFlag) return;
    setProcessingFlag(true);
    // 즉시 다이얼로그 닫기
    setConfirmDialog({ ...confirmDialog, open: false });
    setLoading(true);
    try {
      // notes 값 추출
      const notes = formData.notes || '시설물 이동/폐기/분실 관리 화면에서 분실 처리됨';
      
      // 순차적으로 처리 (한 번에 하나씩)
      let successCount = 0;
      let failedFacilities = [];
      
      for (const facility of selectedFacilities) {
        try {
          // 이동 전에 시설물 상태 재확인
          const facilityResponse = await fetch(`http://localhost:8080/api/facilities/${facility.facilityId}`, {
            headers: {
              'Authorization': `Bearer ${sessionStorage.getItem('token')}`
            }
          });
          
          if (!facilityResponse.ok) {
            throw new Error(`시설물 정보 조회 실패 (ID: ${facility.facilityId})`);
          }
          
          const facilityData = await facilityResponse.json();
          // 폐기 상태 확인 ("002003_0003": 폐기중, "002003_0004": 폐기완료, "002003_0005": 분실)
          if (facilityData.statusCode === "002003_0003" || 
              facilityData.statusCode === "002003_0004" || 
              facilityData.statusCode === "002003_0005") {
            throw new Error(`이미 폐기 또는 분실 처리된 시설물입니다 (ID: ${facility.facilityId}, ${facilityData.facilityTypeName})`);
          }
          
          let response;
          
          // 이미지가 있는 경우 multipart/form-data로 전송
          if (facility.images && facility.images.length > 0) {
            const formDataObj = new FormData();
            
            // 분실 요청 정보를 JSON 문자열로 변환하여 추가
            const lostRequest = {
              facilityId: facility.facilityId,
              locationCompanyId: formData.companyId, 
              notes: notes
            };
            
            // JSON 객체를 문자열로 변환하여 request 파라미터로 추가
            formDataObj.append('request', JSON.stringify(lostRequest));
            
            // 해당 시설물에 연결된 이미지 파일들 추가
            for (const image of facility.images) {
              formDataObj.append('images', image);
            }
            
            // 이미지 첨부 지원 API 호출
            response = await fetch('http://localhost:8080/api/facility-transactions/lost-with-images', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('token')}`
              },
              body: formDataObj
            });
          } else {
            // 이미지 없는 경우 API 호출
            response = await fetch('http://localhost:8080/api/facility-transactions/lost', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionStorage.getItem('token')}`
              },
              body: JSON.stringify({
                facilityId: facility.facilityId,
                locationCompanyId: formData.companyId, 
                notes: notes
              })
            });
          }
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `시설물 (ID: ${facility.facilityId}) 분실 처리 중 오류가 발생했습니다.`);
          }
          
          // 각 시설물 처리 후 0.5초 지연 (서버 부하 방지 및 중복 생성 방지)
          await new Promise(resolve => setTimeout(resolve, 500));
          successCount++;
        } catch (error) {
          console.error(`시설물 (${facility.facilityTypeName} / ${facility.managementNumber}) 분실 처리 실패:`, error);
          failedFacilities.push({
            ...facility,
            errorMessage: error.message
          });
        }
      }
      
      if (successCount > 0) {
        showSnackbar(`${successCount}개의 시설물 분실 처리가 성공적으로 완료되었습니다.${failedFacilities.length > 0 ? ' 일부 시설물은 처리에 실패했습니다.' : ''}`, 'success');
        
        // 이미지 관련 상태 초기화
        setCurrentFacilityId(null);
        setImageUploadError('');
      }
      
      if (failedFacilities.length > 0) {
        console.error('분실 처리 실패한 시설물:', failedFacilities);
        // 실패한 시설물만 남기고 성공한 것은 제거
        
        // 미리보기 URL 해제
        const successFacilities = selectedFacilities.filter(
          facility => !failedFacilities.some(
            failedFacility => String(failedFacility.facilityId) === String(facility.facilityId)
          )
        );
        
        successFacilities.forEach(facility => {
          facility.previewUrls.forEach(url => URL.revokeObjectURL(url));
        });
        
        setSelectedFacilities(failedFacilities);
      } else {
        // 모두 성공하면 초기화
        
        // 미리보기 URL 해제
        selectedFacilities.forEach(facility => {
          facility.previewUrls.forEach(url => URL.revokeObjectURL(url));
        });
        
        setFormData({
          sourceCompanyId: '',
          sourceCompanyName: '',
          facilityId: '',
          facilityName: '',
          destinationCompanyId: '',
          destinationCompanyName: '',
          companyId: '',
          companyName: '',
          notes: '',
          reason: '',
          locationCompanyId: '',
          currentSourceCompanyId: '',
          currentSourceCompanyName: ''
        });
        setSelectedFacilities([]);
        setFacilities([]);
      }
    } catch (error) {
      console.error('시설물 분실 처리 중 오류 발생:', error);
      showSnackbar(error.message || '시설물 분실 처리 중 오류가 발생했습니다.', 'error');
    } finally {
      setLoading(false);
      setProcessingFlag(false);
    }
  };

  // 기타 트랜잭션 확인 처리
  const confirmMisc = async () => {
    if (processingFlag) return;
    setProcessingFlag(true);
    // 즉시 다이얼로그 닫기
    setConfirmDialog({ ...confirmDialog, open: false });
    setLoading(true);
    try {
      // notes 값 추출
      const notes = formData.notes || '기타 트랜잭션 처리';
      
      // 순차적으로 처리 (한 번에 하나씩)
      let successCount = 0;
      let failedFacilities = [];
      
      for (const facility of selectedFacilities) {
        try {
          // 시설물 상태 재확인
          const facilityResponse = await fetch(`http://localhost:8080/api/facilities/${facility.facilityId}`, {
            headers: {
              'Authorization': `Bearer ${sessionStorage.getItem('token')}`
            }
          });
          
          if (!facilityResponse.ok) {
            throw new Error(`시설물 정보 조회 실패 (ID: ${facility.facilityId})`);
          }
          
          const facilityData = await facilityResponse.json();
          // 폐기 상태 확인 ("002003_0003": 폐기중, "002003_0004": 폐기완료)
          if (facilityData.statusCode === "002003_0003" || facilityData.statusCode === "002003_0004") {
            throw new Error(`폐기 처리된 시설물은 기타 트랜잭션을 처리할 수 없습니다 (ID: ${facility.facilityId}, ${facilityData.facilityTypeName})`);
          }
          
          let response;
          
          // 이미지가 있는 경우 multipart/form-data로 전송
          if (facility.images && facility.images.length > 0) {
            const formDataObj = new FormData();
            
            // 기타 요청 정보를 JSON 문자열로 변환하여 추가
            const miscRequest = {
              facilityId: facility.facilityId,
              locationCompanyId: formData.companyId,
              reason: formData.reason,
              notes: notes
            };
            
            // JSON 객체를 문자열로 변환하여 request 파라미터로 추가
            formDataObj.append('request', JSON.stringify(miscRequest));
            
            // 해당 시설물에 연결된 이미지 파일들 추가
            for (const image of facility.images) {
              formDataObj.append('images', image);
            }
            
            // 이미지 첨부 지원 API 호출
            response = await fetch('http://localhost:8080/api/facility-transactions/misc-with-images', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('token')}`
              },
              body: formDataObj
            });
          } else {
            // 이미지 없는 경우 API 호출
            response = await fetch('http://localhost:8080/api/facility-transactions/misc', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionStorage.getItem('token')}`
              },
              body: JSON.stringify({
                facilityId: facility.facilityId,
                locationCompanyId: formData.companyId,
                reason: formData.reason,
                notes: notes
              })
            });
          }
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `시설물 (ID: ${facility.facilityId}) 기타 트랜잭션 처리 중 오류가 발생했습니다.`);
          }
          
          // 각 시설물 처리 후 0.5초 지연 (서버 부하 방지 및 중복 생성 방지)
          await new Promise(resolve => setTimeout(resolve, 500));
          successCount++;
        } catch (error) {
          console.error(`시설물 (${facility.facilityTypeName} / ${facility.managementNumber}) 기타 트랜잭션 처리 실패:`, error);
          failedFacilities.push({
            ...facility,
            errorMessage: error.message
          });
        }
      }
      
      if (successCount > 0) {
        showSnackbar(`${successCount}개의 시설물 기타 트랜잭션이 성공적으로 처리되었습니다.${failedFacilities.length > 0 ? ' 일부 시설물은 처리에 실패했습니다.' : ''}`, 'success');
        
        // 이미지 관련 상태 초기화
        setCurrentFacilityId(null);
        setImageUploadError('');
      }
      
      if (failedFacilities.length > 0) {
        console.error('기타 트랜잭션 처리 실패한 시설물:', failedFacilities);
        // 실패한 시설물만 남기고 성공한 것은 제거
        
        // 미리보기 URL 해제
        const successFacilities = selectedFacilities.filter(
          facility => !failedFacilities.some(
            failedFacility => String(failedFacility.facilityId) === String(facility.facilityId)
          )
        );
        
        successFacilities.forEach(facility => {
          facility.previewUrls.forEach(url => URL.revokeObjectURL(url));
        });
        
        setSelectedFacilities(failedFacilities);
      } else {
        // 모두 성공하면 초기화
        
        // 미리보기 URL 해제
        selectedFacilities.forEach(facility => {
          facility.previewUrls.forEach(url => URL.revokeObjectURL(url));
        });
        
        setFormData({
          sourceCompanyId: '',
          sourceCompanyName: '',
          facilityId: '',
          facilityName: '',
          destinationCompanyId: '',
          destinationCompanyName: '',
          companyId: '',
          companyName: '',
          notes: '',
          reason: '',
          locationCompanyId: '',
          currentSourceCompanyId: '',
          currentSourceCompanyName: ''
        });
        setSelectedFacilities([]);
        setFacilities([]);
      }
    } catch (error) {
      console.error('기타 트랜잭션 처리 중 오류 발생:', error);
      showSnackbar(error.message || '기타 트랜잭션 처리 중 오류가 발생했습니다.', 'error');
    } finally {
      setLoading(false);
      setProcessingFlag(false);
    }
  };

  // 스낵바 메시지 표시
  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  // 스낵바 닫기
  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  // 다이얼로그 닫기
  const handleCloseDialog = () => {
    setConfirmDialog({
      ...confirmDialog,
      open: false
    });
  };

  // 이미지 업로드 처리 - 특정 시설물에 연결된 이미지 업로드
  const handleImageUpload = (e, facilityId) => {
    const files = Array.from(e.target.files);
    
    // 해당 시설물 찾기
    const facilityIndex = selectedFacilities.findIndex(
      facility => String(facility.facilityId) === String(facilityId)
    );
    
    if (facilityIndex === -1) {
      showSnackbar('시설물을 찾을 수 없습니다.', 'error');
      return;
    }
    
    const facility = selectedFacilities[facilityIndex];
    
    // 최대 이미지 개수 체크
    if (facility.images.length + files.length > MAX_IMAGE_COUNT) {
      setImageUploadError(`이미지는 최대 ${MAX_IMAGE_COUNT}개까지 업로드할 수 있습니다.`);
      showSnackbar(`이미지는 최대 ${MAX_IMAGE_COUNT}개까지 업로드할 수 있습니다.`, 'warning');
      return;
    }
    
    // 각 파일 유효성 검사 및 미리보기 생성
    const validFiles = [];
    const newPreviewUrls = [...facility.previewUrls];
    
    files.forEach(file => {
      // 파일 크기 체크
      if (file.size > MAX_IMAGE_SIZE) {
        setImageUploadError(`파일 크기는 5MB를 초과할 수 없습니다. (${file.name})`);
        showSnackbar(`파일 크기는 5MB를 초과할 수 없습니다. (${file.name})`, 'warning');
        return;
      }
      
      // 이미지 파일 형식 체크
      if (!file.type.includes('image/')) {
        setImageUploadError(`이미지 파일만 업로드할 수 있습니다. (${file.name})`);
        showSnackbar(`이미지 파일만 업로드할 수 있습니다. (${file.name})`, 'warning');
        return;
      }
      
      // 미리보기 URL 생성
      const previewUrl = URL.createObjectURL(file);
      newPreviewUrls.push(previewUrl);
      validFiles.push(file);
    });
    
    // 유효한 파일만 상태에 추가
    if (validFiles.length > 0) {
      const updatedFacilities = [...selectedFacilities];
      updatedFacilities[facilityIndex] = {
        ...facility,
        images: [...facility.images, ...validFiles],
        previewUrls: newPreviewUrls
      };
      
      setSelectedFacilities(updatedFacilities);
    }
    
    // 파일 선택 입력 초기화 (같은 파일 다시 선택 가능하도록)
    e.target.value = null;
  };
  
  // 이미지 삭제 처리 - 특정 시설물의 특정 이미지 삭제
  const handleRemoveImage = (facilityId, imageIndex) => {
    const facilityIndex = selectedFacilities.findIndex(
      facility => String(facility.facilityId) === String(facilityId)
    );
    
    if (facilityIndex === -1) {
      showSnackbar('시설물을 찾을 수 없습니다.', 'error');
      return;
    }
    
    const facility = selectedFacilities[facilityIndex];
    
    // 미리보기 URL 객체 해제
    URL.revokeObjectURL(facility.previewUrls[imageIndex]);
    
    // 이미지 배열과 미리보기 배열에서 제거
    const newImages = [...facility.images];
    newImages.splice(imageIndex, 1);
    
    const newPreviewUrls = [...facility.previewUrls];
    newPreviewUrls.splice(imageIndex, 1);
    
    // 업데이트된 시설물로 상태 갱신
    const updatedFacilities = [...selectedFacilities];
    updatedFacilities[facilityIndex] = {
      ...facility,
      images: newImages,
      previewUrls: newPreviewUrls
    };
    
    setSelectedFacilities(updatedFacilities);
  };
  
  // 목록으로 돌아가기
  const handleGoToList = () => {
    navigate('/facility-list');
  };

  // handleDateChange 함수 추가
  const handleDateChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#F8F8FE', minHeight: '100vh' }}>
      {/* 상단 헤더 */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#3A3A3A' }}>
          시설물 출고
        </Typography>
      </Box>

      {/* 메인 컨텐츠 영역 */}
      <Box sx={{ 
        backgroundColor: 'white',
        borderRadius: 2,
        border: '1px solid #EEEEEE',
        p: 3,
        mb: 3
      }}>
        <form onSubmit={handleSubmit}>
          {/* 작업 유형 선택 섹션 */}
          <Box sx={{ mb: 4 }}>
            <Typography 
              variant="subtitle1" 
              sx={{ 
                fontWeight: 600, 
                color: '#3A3A3A',
                mb: 2 
              }}
            >
              작업 유형
            </Typography>

            <Box sx={{ 
              backgroundColor: '#F8F9FA',
              borderRadius: 2,
              border: '1px solid #EEEEEE',
              p: 3
            }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>
                    작업 선택
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={operationType}
                      onChange={handleOperationTypeChange}
                      sx={{
                        backgroundColor: '#F8F9FA',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#E0E0E0',
                        },
                      }}
                    >
                      <MenuItem value="move">시설물 이동</MenuItem>
                      <MenuItem value="dispose">시설물 폐기</MenuItem>
                      <MenuItem value="lost">시설물 분실</MenuItem>
                      <MenuItem value="misc">기타</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
          </Box>

          {/* 작업 정보 섹션 */}
          <Box sx={{ mb: 4 }}>
            <Typography 
              variant="subtitle1" 
              sx={{ 
                fontWeight: 600, 
                color: '#3A3A3A',
                mb: 2 
              }}
            >
              {operationType === 'move' ? '이동 정보' : 
               operationType === 'dispose' ? '폐기 정보' : 
               operationType === 'lost' ? '분실 정보' : '기타 행동이력 정보'}
            </Typography>

            <Box sx={{ 
              backgroundColor: '#F8F9FA',
              borderRadius: 2,
              border: '1px solid #EEEEEE',
              p: 3
            }}>
              {operationType === 'move' ? (
                <MoveForm
                  formData={formData}
                  selectedFacilities={selectedFacilities}
                  isUserRole={isUserRole}
                  handleChange={handleChange}
                  handleOpenCompanyDialog={handleOpenCompanyDialog}
                  handleAddFacility={handleAddFacility}
                  handleRemoveFacility={handleRemoveFacility}
                  handleImageUpload={handleImageUpload}
                  handleRemoveImage={handleRemoveImage}
                  MAX_IMAGE_COUNT={MAX_IMAGE_COUNT}
                />
              ) : operationType === 'dispose' ? (
                <DisposeForm
                  formData={formData}
                  selectedFacilities={selectedFacilities}
                  isUserRole={isUserRole}
                  handleChange={handleChange}
                  handleOpenCompanyDialog={handleOpenCompanyDialog}
                  handleAddFacility={handleAddFacility}
                  handleRemoveFacility={handleRemoveFacility}
                  handleImageUpload={handleImageUpload}
                  handleRemoveImage={handleRemoveImage}
                  MAX_IMAGE_COUNT={MAX_IMAGE_COUNT}
                />
              ) : operationType === 'lost' ? (
                <LostForm
                  formData={formData}
                  selectedFacilities={selectedFacilities}
                  companies={companies}
                  isUserRole={isUserRole}
                  handleChange={handleChange}
                  handleDateChange={handleDateChange}
                  handleOpenCompanyDialog={handleOpenCompanyDialog}
                  handleAddFacility={handleAddFacility}
                  handleRemoveFacility={handleRemoveFacility}
                  handleImageUpload={handleImageUpload}
                  handleRemoveImage={handleRemoveImage}
                  MAX_IMAGE_COUNT={MAX_IMAGE_COUNT}
                />
              ) : (
                <MiscForm
                  formData={formData}
                  selectedFacilities={selectedFacilities}
                  isUserRole={isUserRole}
                  handleChange={handleChange}
                  handleOpenCompanyDialog={handleOpenCompanyDialog}
                  handleAddFacility={handleAddFacility}
                  handleRemoveFacility={handleRemoveFacility}
                  handleImageUpload={handleImageUpload}
                  handleRemoveImage={handleRemoveImage}
                  MAX_IMAGE_COUNT={MAX_IMAGE_COUNT}
                />
              )}
            </Box>
          </Box>
          
          {/* 주의사항 섹션 */}
          <Box sx={{ mb: 4 }}>
            <Typography 
              variant="subtitle1" 
              sx={{ 
                fontWeight: 600, 
                color: '#3A3A3A',
                mb: 2 
              }}
            >
              주의사항
            </Typography>

            <Box sx={{ 
              backgroundColor: '#F8F9FA',
              borderRadius: 2,
              border: '1px solid #EEEEEE',
              p: 3
            }}>
              {operationType === 'move' ? (
                <Typography variant="body2" color="text.secondary">
                  * 시설물 이동 처리 시 시설물의 모든 이력과 데이터는 함께 이동됩니다.
                </Typography>
              ) : operationType === 'dispose' ? (
                <>
                  <Typography variant="body2" color="text.secondary">
                    * 폐기된 시설물은 복구할 수 없으며, 관련 데이터는 보관됩니다.
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    * 시설물 폐기는 되돌릴 수 없으므로 신중하게 처리해주세요.
                  </Typography>
                </>
              ) : operationType === 'lost' ? (
                <>
                  <Typography variant="body2" color="text.secondary">
                    * 분실된 시설물은 분실 상태로 전환되며, 관련 데이터는 보관됩니다.
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    * 분실된 시설물이 발견될 경우 시설물 상세 화면에서 상태를 변경할 수 있습니다.
                  </Typography>
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  * 시설물 데이터의 일관성을 위한 작업입니다.
                </Typography>
              )}
            </Box>
          </Box>
          
          {/* 하단 버튼 */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 4 }}>
            <Button
              type="button"
              variant="outlined"
              disabled={loading}
              onClick={handleGoToList}
              sx={{
                borderColor: '#E0E0E0',
                color: '#666',
                px: 4,
                py: 1,
                '&:hover': {
                  backgroundColor: '#F8F9FA',
                  borderColor: '#E0E0E0',
                },
              }}
            >
              취소
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              color={
                operationType === 'move' ? 'primary' : 
                operationType === 'dispose' ? 'error' : 
                operationType === 'lost' ? 'warning' : 'info'
              }
              sx={{
                px: 4,
                py: 1,
                backgroundColor: 
                  operationType === 'move' ? '#1976d2' : 
                  operationType === 'dispose' ? '#d32f2f' : 
                  operationType === 'lost' ? '#ed6c02' : '#0288d1',
                '&:hover': {
                  backgroundColor: 
                    operationType === 'move' ? '#1565c0' : 
                    operationType === 'dispose' ? '#b71c1c' : 
                    operationType === 'lost' ? '#e65100' : '#01579b',
                },
              }}
            >
              {loading ? (
                <>
                  <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                  처리 중...
                </>
              ) : operationType === 'move' ? '이동 처리' : 
                 operationType === 'dispose' ? '폐기 처리' : 
                 operationType === 'lost' ? '분실 처리' : '처리'}
            </Button>
          </Box>
        </form>
      </Box>

      {/* 알림 스낵바 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* 확인 다이얼로그 */}
      <Dialog
        open={confirmDialog.open}
        onClose={handleCloseDialog}
      >
        <DialogTitle>{confirmDialog.title}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmDialog.message}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleCloseDialog} 
            color="primary"
            disabled={loading}
          >
            취소
          </Button>
          <Button 
            onClick={confirmDialog.onConfirm} 
            color="primary" 
            disabled={loading}
            autoFocus
          >
            {loading ? '처리 중...' : '확인'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 수탁업체 선택 다이얼로그 */}
      <FacilityCompanySelectDialog
        open={companyDialog.open}
        onClose={handleCloseCompanyDialog}
        onSelect={handleSelectCompany}
        title={companyDialog.title}
        excludeCompanyId={companyDialog.excludeCompanyId}
      />
      
      {/* 시설물 선택 다이얼로그 */}
      <FacilitySelectDialog
        open={facilityDialog.open}
        onClose={handleCloseFacilityDialog}
        onSelect={handleSelectFacility}
        title={`${facilityDialog.type === 'move' ? '이동할' : '폐기할'} 시설물 선택`}
        companyId={facilityDialog.companyId}
        alreadySelectedFacilities={selectedFacilities}
      />
    </Box>
  );
};

export default FacilityTransfer; 