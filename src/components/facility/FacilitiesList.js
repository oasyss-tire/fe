import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  IconButton,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Pagination,
  CircularProgress,
  Snackbar,
  Alert,
  Tabs,
  Tab,
  Card,
  CardContent
} from '@mui/material';
import { 
  Search as SearchIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import FacilityTypeList from './FacilityTypeList';
import { keyframes } from '@emotion/react';
import { useAuth } from '../../contexts/AuthContext';

// 스켈레톤 애니메이션을 위한 키프레임 정의
const pulse = keyframes`
  0% {
    opacity: 0.6;
  }
  50% {
    opacity: 0.3;
  }
  100% {
    opacity: 0.6;
  }
`;

// 스켈레톤 애니메이션 스타일
const skeletonAnimation = `${pulse} 1.5s infinite ease-in-out`;

// 시설물 상태 코드 맵핑
const statusColorMap = {
  '002003_0001': 'success', // 사용중 (정상)
  '002003_0002': 'error',   // 고장
  '002003_0003': 'warning', // 수리중
  '002003_0004': 'info',    // AS 접수중
  '002003_0006': 'success'  // AS 완료
};

// 시설물별 조회 컴포넌트 (임시 - 나중에 별도 파일로 분리 가능)
const FacilityTypeView = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 3 }}>
        시설물별 조회 (준비 중)
      </Typography>
      <Paper sx={{ p: 5, textAlign: 'center' }}>
        <Typography variant="body1" color="textSecondary">
          시설물별 조회 기능은 개발 중입니다.
        </Typography>
      </Paper>
    </Box>
  );
};

// 탭 패널 컴포넌트
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`facility-tabpanel-${index}`}
      aria-labelledby={`facility-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box>
          {children}
        </Box>
      )}
    </div>
  );
}

const FacilitiesList = () => {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [facilityTypesLoading, setFacilityTypesLoading] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [selectedFacilities, setSelectedFacilities] = useState([]);
  const [viewAllFacilities, setViewAllFacilities] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [tabValue, setTabValue] = useState(0); // 탭 상태 추가
  const [totalItems, setTotalItems] = useState(0); // 전체 시설물 개수 상태 추가

  // 현재 재고 현황 관련 상태 추가
  const [currentInventory, setCurrentInventory] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [facilityTypes, setFacilityTypes] = useState([]);
  // 전표 정보를 표시하기 위한 상태 추가
  const [selectedInventoryItem, setSelectedInventoryItem] = useState(null);
  
  // 고장/수리중 상태 시설물 정보
  const [failedFacilities, setFailedFacilities] = useState({});

  // 시설물 유형별 총 수량 상태 추가
  const [facilityCounts, setFacilityCounts] = useState({});
  const [totalCountsLoading, setTotalCountsLoading] = useState(false);

  // 알림 상태
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // 각 수탁업체별 시설물 유형 개수 매핑 (2차원 배열)
  const [facilityCountMatrix, setFacilityCountMatrix] = useState({});
  
  // 페이지네이션
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // 페이징 관련 상태 추가 (회사 목록용)
  const [companyPage, setCompanyPage] = useState(0);
  const [companyPageSize, setCompanyPageSize] = useState(5);
  const [companyTotalPages, setCompanyTotalPages] = useState(1);
  const [displayedCompanies, setDisplayedCompanies] = useState([]);

  // 통합 로딩 상태
  const [dataReady, setDataReady] = useState(false);
  
  // 셀 클릭 관련 상태 추가
  const [clickedCell, setClickedCell] = useState(null);
  const [cellLoading, setCellLoading] = useState(false);
  const [clickedStore, setClickedStore] = useState(null);
  const [storeLoading, setStoreLoading] = useState(false);
  
  // 선택된 셀 상태 추가
  const [selectedCell, setSelectedCell] = useState(null);

  // 초기 데이터 로딩
  useEffect(() => {
    const loadInitialData = async () => {
      setDataReady(false); // 초기 로딩 시작
      setLoading(true);
      
      try {
        // 시설물 유형 코드 조회
        const typesResponse = await fetch('http://localhost:8080/api/codes/groups/002001/codes/active', {
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`
          }
        });
        
        if (!typesResponse.ok) {
          throw new Error('시설물 유형 코드를 불러오는데 실패했습니다.');
        }
        
        const typesData = await typesResponse.json();
        
        // sortOrder 기준으로 정렬
        const sortedTypesData = typesData.sort((a, b) => a.sortOrder - b.sortOrder);
        setFacilityTypes(sortedTypesData);
        
        // 시설물 유형별 총 수량 조회
        await fetchFacilityCountsByType();
        
        // 회사 목록 조회 - 사용자 권한에 따라 다르게 처리
        let companiesData = [];
        
        // USER 또는 MANAGER 권한을 가진 사용자는 자신의 회사만 조회
        if (authUser && (authUser.role === 'USER' || authUser.role === 'MANAGER') && authUser.companyId) {
          // 단일 회사 정보 조회
          const companyResponse = await fetch(`http://localhost:8080/api/companies/${authUser.companyId}`, {
            headers: {
              'Authorization': `Bearer ${sessionStorage.getItem('token')}`
            }
          });
          
          if (!companyResponse.ok) {
            throw new Error('수탁업체 정보를 불러오는데 실패했습니다.');
          }
          
          const companyData = await companyResponse.json();
          companiesData = [companyData]; // 단일 회사 정보를 배열로 설정
        } else {
          // 관리자 등 다른 권한은 모든 회사 목록 조회
          const companiesResponse = await fetch('http://localhost:8080/api/companies', {
            headers: {
              'Authorization': `Bearer ${sessionStorage.getItem('token')}`
            }
          });
          
          if (!companiesResponse.ok) {
            throw new Error('수탁업체 목록을 불러오는데 실패했습니다.');
          }
          
          companiesData = await companiesResponse.json();
        }
        
        // 상태 업데이트
        setCompanies(companiesData);
        
        // 회사가 있으면 첫 페이지의 회사들에 대한 재고 현황 조회
        if (companiesData.length > 0) {
          const startIndex = 0;
          const endIndex = Math.min(companyPageSize, companiesData.length);
          const companiesForFirstPage = companiesData.slice(startIndex, endIndex);
          setDisplayedCompanies(companiesForFirstPage);
          
          // 고장/수리중 상태 시설물 정보 조회 - 빈 객체 설정으로 대체
          setFailedFacilities({});
          
          // 재고 현황 조회
          await fetchInventoryForCompanies(companiesForFirstPage);
        } else {
          // 표시할 회사가 없으면 데이터 준비 완료로 설정
          setDataReady(true);
        }
      } catch (error) {
        console.error('초기 데이터 로딩 실패:', error);
        showSnackbar('데이터를 불러오는데 실패했습니다.', 'error');
        setDataReady(true); // 에러가 발생해도 로딩은 종료
      } finally {
        setLoading(false);
      }
    };
    
    loadInitialData();
  }, [authUser]);

  // 시설물 유형별 총 수량 조회
  const fetchFacilityCountsByType = async () => {
    setTotalCountsLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/facilities/counts-by-type', {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('시설물 유형별 수량을 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      setFacilityCounts(data);
    } catch (error) {
      console.error('시설물 유형별 수량 조회 실패:', error);
      showSnackbar('시설물 유형별 수량을 불러오는데 실패했습니다.', 'error');
    } finally {
      setTotalCountsLoading(false);
    }
  };

  // 회사 목록 조회 (초기 로딩에서 처리하므로 제거)
  const fetchCompanies = async () => {
    // 페이지 변경이나 검색 시에만 사용
    setLoading(true);
    setDataReady(false);
    try {
      // 사용자 권한에 따라 다른 API 호출
      let response;
      
      if (authUser && (authUser.role === 'USER' || authUser.role === 'MANAGER') && authUser.companyId) {
        // 단일 회사 정보만 조회
        response = await fetch(`http://localhost:8080/api/companies/${authUser.companyId}`, {
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          throw new Error('수탁업체 정보를 불러오는데 실패했습니다.');
        }
        
        const companyData = await response.json();
        setCompanies([companyData]); // 단일 회사 정보를 배열로 설정
      } else {
        // 관리자 등 다른 권한은 모든 회사 목록 조회
        response = await fetch('http://localhost:8080/api/companies', {
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          throw new Error('수탁업체 목록을 불러오는데 실패했습니다.');
        }
        
        const data = await response.json();
        setCompanies(data);
      }
    } catch (error) {
      console.error('수탁업체 목록 조회 실패:', error);
      showSnackbar('수탁업체 목록을 불러오는데 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 검색어로 회사 필터링 적용
  useEffect(() => {
    // 초기 로딩 중에는 실행하지 않음
    if (companies.length > 0 && !loading) {
      let filtered = [...companies];
      
      // 검색어 필터링
      if (searchKeyword && searchKeyword.trim() !== '') {
        const term = searchKeyword.trim().toLowerCase();
        filtered = filtered.filter(company => 
          (company.storeName && company.storeName.toLowerCase().includes(term)) || 
          (company.phoneNumber && company.phoneNumber.toLowerCase().includes(term))
        );
      }
      
      // 필터링된 전체 결과에 대한 페이지 정보 업데이트
      setCompanyTotalPages(Math.ceil(filtered.length / companyPageSize));
      
      // 현재 페이지에 표시할 회사 계산
      const startIndex = companyPage * companyPageSize;
      const endIndex = Math.min(startIndex + companyPageSize, filtered.length);
      const companiesForCurrentPage = filtered.slice(startIndex, endIndex);
      
      setDisplayedCompanies(companiesForCurrentPage);
      
      // 현재 페이지의 회사들에 대한 재고 현황만 조회
      if (companiesForCurrentPage.length > 0) {
        // 데이터 로딩 시작 시 dataReady 상태 초기화
        setDataReady(false);
        fetchInventoryForCompanies(companiesForCurrentPage);
      } else {
        // 표시할 회사가 없으면 매트릭스 초기화 및 데이터 준비 완료로 설정
        setCurrentInventory([]);
        setFacilityCountMatrix({});
        setDataReady(true);
      }
    }
  }, [companies, companyPage, companyPageSize, searchKeyword, loading]);

  // 특정 회사들에 대한 재고 현황 조회
  const fetchInventoryForCompanies = async (companiesToFetch) => {
    setInventoryLoading(true);
    setDataReady(false); // 데이터 로딩 시작 시 dataReady 상태 초기화
    try {
      // 회사 ID 목록 추출
      const companyIds = companiesToFetch.map(company => company.id);
      
      // 회사별로 재고 현황 조회 (병렬 처리)
      const inventoryPromises = companyIds.map(companyId => 
        fetch(`http://localhost:8080/api/v1/inventory/current-status-db-paged?companyId=${companyId}&page=0&size=100`, {
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`
          }
        })
        .then(response => {
          if (!response.ok) {
            throw new Error(`회사 ID ${companyId}의 재고 현황을 불러오는데 실패했습니다.`);
          }
          return response.json();
        })
      );
      
      // 모든 요청이 완료될 때까지 대기
      const inventoryResults = await Promise.all(inventoryPromises);
      
      // 결과 합치기
      let allInventory = [];
      inventoryResults.forEach(result => {
        if (result.content) {
          allInventory = [...allInventory, ...result.content];
        }
      });
      
      setCurrentInventory(allInventory);
      
      // 재고 현황 데이터로 매트릭스 생성
      createInventoryMatrix(allInventory);
      
      // 모든 데이터 로딩 완료
      setDataReady(true);
    } catch (error) {
      console.error('재고 현황 조회 실패:', error);
      showSnackbar('재고 현황을 불러오는데 실패했습니다.', 'error');
      setDataReady(true); // 에러가 발생해도 로딩은 종료
    } finally {
      setInventoryLoading(false);
    }
  };

  // 회사 페이지 변경 핸들러
  const handleCompanyPageChange = (event, newPage) => {
    setCompanyPage(newPage - 1); // MUI는 1부터 시작하는 페이지 번호 사용
  };

  // 탭 변경 핸들러
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // 특정 수탁업체, 특정 시설물 유형 선택 시 해당 시설물 목록 필터링
  const handleCellClick = (companyId, typeCode) => {
    // 이미 클릭된 셀이면 무시
    if (selectedCompany === companyId && selectedType === typeCode) return;
    
    // 선택된 셀 정보 저장
    setSelectedCell({ companyId, typeCode });
    
    // 클릭된 셀 정보 저장 및 로딩 상태 활성화
    setClickedCell({ companyId, typeCode });
    setCellLoading(true);
    
    // 렌더링 최적화를 위해 setTimeout을 통해 UI 업데이트와 API 호출 분리
    setTimeout(() => {
      // 현재 가지고 있는 재고 데이터에서 해당 회사와 시설물 유형에 맞는 데이터 찾기
      const inventoryItem = currentInventory.find(
        item => item.companyId === companyId && item.facilityTypeCodeId === typeCode
      );
      
      // 모든 상태 업데이트를 한 번의 렌더링 사이클로 처리
      setSelectedCompany(companyId);
      setSelectedType(typeCode);
      setViewAllFacilities(false);
      setSelectedInventoryItem(inventoryItem);
      
      // API 호출
      fetch(`http://localhost:8080/api/facilities?companyId=${companyId}&facilityTypeCode=${typeCode}&page=0&size=10&isActive=true`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      })
        .then(response => {
          if (!response.ok) {
            throw new Error('시설물 목록을 불러오는데 실패했습니다.');
          }
          return response.json();
        })
        .then(data => {
          // API 응답 처리
          setSelectedFacilities(data.content || []);
          setTotalPages(data.totalPages || 1);
          setPage(0);
          if (data.totalElements !== undefined) {
            setTotalItems(data.totalElements);
          }
        })
        .catch(error => {
          console.error('시설물 목록 조회 실패:', error);
          showSnackbar('시설물 목록을 불러오는데 실패했습니다.', 'error');
        })
        .finally(() => {
          // 로딩 상태 해제 (모든 처리가 완료된 후 한 번에 해제)
          setCellLoading(false);
        });
    }, 0);
  };

  // 매장명 클릭 시 해당 매장의 모든 시설물 표시
  const handleStoreNameClick = (companyId) => {
    // 이미 클릭된 매장이면 무시
    if (selectedCompany === companyId && !selectedType) return;
    
    // 선택된 셀 초기화 (매장명 클릭 시 셀 선택 해제)
    setSelectedCell(null);
    
    // 클릭된 매장 정보 저장 및 로딩 상태 활성화
    setClickedStore(companyId);
    setStoreLoading(true);
    
    // 렌더링 최적화를 위해 setTimeout을 통해 UI 업데이트와 API 호출 분리
    setTimeout(() => {
      // 모든 상태 업데이트를 한 번의 렌더링 사이클로 처리
      setSelectedCompany(companyId);
      setSelectedType(null);
      setViewAllFacilities(true);
      setSelectedInventoryItem(null); // 전표 정보 초기화
      
      // API 호출
      fetch(`http://localhost:8080/api/facilities?companyId=${companyId}&page=0&size=10&isActive=true`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      })
        .then(response => {
          if (!response.ok) {
            throw new Error('시설물 목록을 불러오는데 실패했습니다.');
          }
          return response.json();
        })
        .then(data => {
          // API 응답 처리
          setSelectedFacilities(data.content || []);
          setTotalPages(data.totalPages || 1);
          setPage(0);
          if (data.totalElements !== undefined) {
            setTotalItems(data.totalElements);
          }
        })
        .catch(error => {
          console.error('시설물 목록 조회 실패:', error);
          showSnackbar('시설물 목록을 불러오는데 실패했습니다.', 'error');
        })
        .finally(() => {
          // 로딩 상태 해제 (모든 처리가 완료된 후 한 번에 해제)
          setStoreLoading(false);
        });
    }, 0);
  };

  const handleAddFacility = () => {
    navigate('/facility-register');
  };

  const handleViewFacility = (facilityId) => {
    navigate(`/facility-detail/${facilityId}`);
  };

  const handlePageChange = (event, value) => {
    const pageIndex = value - 1;
    
    // 페이지 변경 시 현재 선택된 정보에 따라 적절한 API 호출
    if (selectedCompany) {
      // 로딩 상태 설정
      setLoading(true);
      
      if (selectedType) {
        // 특정 회사의 특정 시설물 유형에 대한 페이징
        fetch(`http://localhost:8080/api/facilities?companyId=${selectedCompany}&facilityTypeCode=${selectedType}&page=${pageIndex}&size=10&isActive=true`, {
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`
          }
        })
          .then(response => {
            if (!response.ok) {
              throw new Error('시설물 목록을 불러오는데 실패했습니다.');
            }
            return response.json();
          })
          .then(data => {
            setSelectedFacilities(data.content || []);
            setTotalPages(data.totalPages || 1);
            setPage(pageIndex);
            if (data.totalElements !== undefined) {
              setTotalItems(data.totalElements);
            }
          })
          .catch(error => {
            console.error('시설물 목록 조회 실패:', error);
            showSnackbar('시설물 목록을 불러오는데 실패했습니다.', 'error');
          })
          .finally(() => {
            setLoading(false);
          });
      } else {
        // 특정 회사의 모든 시설물에 대한 페이징
        fetch(`http://localhost:8080/api/facilities?companyId=${selectedCompany}&page=${pageIndex}&size=10&isActive=true`, {
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`
          }
        })
          .then(response => {
            if (!response.ok) {
              throw new Error('시설물 목록을 불러오는데 실패했습니다.');
            }
            return response.json();
          })
          .then(data => {
            setSelectedFacilities(data.content || []);
            setTotalPages(data.totalPages || 1);
            setPage(pageIndex);
            if (data.totalElements !== undefined) {
              setTotalItems(data.totalElements);
            }
          })
          .catch(error => {
            console.error('시설물 목록 조회 실패:', error);
            showSnackbar('시설물 목록을 불러오는데 실패했습니다.', 'error');
          })
          .finally(() => {
            setLoading(false);
          });
      }
    }
  };

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({
      ...prev,
      open: false
    }));
  };

  // 날짜 포맷 함수
  const formatDate = (dateString, includeTime = true) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), includeTime ? 'yy-MM-dd HH:mm' : 'yy-MM-dd');
    } catch (error) {
      return dateString;
    }
  };
  
  // 설치일을 년월일만 표시하는 함수
  const formatInstallationDate = (dateString) => {
    if (!dateString) return '-';
    
    try {
      // 날짜 객체로 변환 후 'yy-MM-dd' 형식으로 포맷팅
      return format(new Date(dateString), 'yy-MM-dd');
    } catch (error) {
      // 오류 발생 시 원본 문자열 반환(T 포함 시 T 앞부분만)
      return dateString.includes('T') ? dateString.split('T')[0] : dateString;
    }
  };

  // 특정 수탁업체, 특정 유형의 고장/수리중 상태 시설물이 있는지 확인
  const hasFailed = (companyId, typeCode) => {
    // 고장/수리중 시설물 표시 기능 제거 - 항상 false 반환
    return false;
  };

  // 고장/수리중 상태 시설물 정보 조회
  const fetchFailedFacilities = async () => {
    // 고장/수리중 시설물 조회 기능 제거 - 빈 객체 반환
    setFailedFacilities({});
    return {};
  };

  // 현재 재고 현황 데이터로 매트릭스 생성
  const createInventoryMatrix = (inventoryData) => {
    // 1. 수탁업체별 맵 생성
    const companyMap = {};
    
    // 2. 각 수탁업체마다 시설물 유형별 현재 수량 매핑
    inventoryData.forEach(item => {
      const companyId = item.companyId;
      const typeCode = item.facilityTypeCodeId;
      
      if (!companyMap[companyId]) {
        companyMap[companyId] = {};
      }
      
      // 현재 수량 저장 (일마감 수량 + 최근 입고 - 최근 출고)
      companyMap[companyId][typeCode] = item.currentQuantity;
    });
    
    // 매트릭스 설정
    setFacilityCountMatrix(companyMap);
  };

  // 현재 재고 현황 조회 함수 (기존 함수를 사용하지 않음)
  const fetchCurrentInventory = async () => {
    // 이 함수는 더 이상 직접 호출하지 않음
    // 대신 useEffect에서 페이지가 로드될 때 자동으로 호출됨
    if (displayedCompanies.length > 0) {
      fetchInventoryForCompanies(displayedCompanies);
    }
  };

  // 테이블 셀 렌더링 함수
  const renderTableCell = (company, type) => {
    const count = facilityCountMatrix[company.id]?.[type.codeId] || 0;
    // 고장/수리중 상태 표시 제거
    const isThisCellLoading = cellLoading && clickedCell && 
                     clickedCell.companyId === company.id && 
                     clickedCell.typeCode === type.codeId;
    
    // 선택된 셀 여부 확인
    const isSelected = selectedCell && 
                     selectedCell.companyId === company.id && 
                     selectedCell.typeCode === type.codeId;
    
    // 셀 배경색 결정 - 고장/수리중 표시 제거
    let backgroundColor = 'inherit';
    if (isSelected) {
      backgroundColor = '#e3f2fd'; // 선택된 셀은 하늘색 배경
    } else if (count > 0) {
      backgroundColor = '#f1f8e9';
    }
    
    return (
      <TableCell 
        key={`${company.id}-${type.codeId}`} 
        align="center"
        onClick={() => handleCellClick(company.id, type.codeId)}
        sx={{ 
          cursor: 'pointer',
          backgroundColor,
          '&:hover': {
            backgroundColor: '#e3f2fd',
          },
          padding: '6px 8px', // 패딩 줄임
          position: 'relative', // 로딩 오버레이를 위한 설정
          height: '52px', // 높이 고정으로 깜빡임 방지
          transition: 'none' // 트랜지션 효과 제거로 깜빡임 방지
        }}
      >
        <Box sx={{ 
          visibility: isThisCellLoading ? 'hidden' : 'visible', 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%'
        }}>
          {count}
        </Box>
        
        {/* 로딩 중인 셀에만 오버레이 표시 */}
        {isThisCellLoading && (
          <Box 
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2
            }}
          >
            <CircularProgress size={16} thickness={4} />
          </Box>
        )}
      </TableCell>
    );
  };
  
  // 매장명 셀 렌더링 함수
  const renderStoreNameCell = (company) => {
    const isThisStoreLoading = storeLoading && clickedStore === company.id;
    
    return (
      <TableCell 
        onClick={() => handleStoreNameClick(company.id)}
        sx={{ 
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: '#e3f2fd',
            textDecoration: 'underline'
          },
          position: 'relative', // 로딩 오버레이를 위한 설정
          height: '36px', // 높이 고정으로 깜빡임 방지
          transition: 'none' // 트랜지션 효과 제거로 깜빡임 방지
        }}
      >
        <Box sx={{ 
          visibility: isThisStoreLoading ? 'hidden' : 'visible',
          display: 'flex',
          alignItems: 'center',
          height: '100%'
        }}>
          {company.storeName}
        </Box>
        
        {/* 로딩 중인 매장명에만 오버레이 표시 */}
        {isThisStoreLoading && (
          <Box 
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2
            }}
          >
            <CircularProgress size={16} thickness={4} />
          </Box>
        )}
      </TableCell>
    );
  };

  // 매장별 조회 컴포넌트 렌더링
  const renderCompanyView = () => (
    <>
      {/* 검색 및 도구 바 */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'flex-end' }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>
            지점 검색
          </Typography>
          <TextField
            placeholder="지점명, 전화번호 검색"
            size="small"
            value={searchKeyword}
            onChange={(e) => {
              setSearchKeyword(e.target.value);
              setCompanyPage(0); // 검색어 변경 시 첫 페이지로 이동
            }}
            sx={{ 
              width: '100%',
              backgroundColor: 'white',
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: '#E0E0E0',
                },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#9E9E9E' }} />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <Button
          variant="outlined"
          color="primary"
          onClick={() => navigate('/facility-transfer')}
          sx={{ mr: 1 }}
        >
          시설물 출고 (이동/폐기)
        </Button>
        {/* USER 권한이 아닌 경우에만 시설물 입고 버튼 표시 */}
        {authUser?.role !== 'USER' && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddFacility}
          >
            시설물 입고
          </Button>
        )}
      </Box>

      {/* 시설물 유형별 총 수량 표시 */}
      {totalCountsLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <CircularProgress size={24} />
        </Box>
      ) : facilityCounts && Object.keys(facilityCounts).length > 0 ? (
        <Box sx={{ mb: 4 }}>
          <Card variant="outlined" sx={{ boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                시설물 유형별 총 수량
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 2, borderRadius: '8px', overflow: 'hidden' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      {Object.keys(facilityCounts)
                        .filter(key => key !== 'total')
                        .map((key) => (
                          <TableCell 
                            key={key} 
                            align="center" 
                            sx={{ 
                              fontWeight: 'bold', 
                              fontSize: '0.85rem',
                              py: 1.5,
                              borderRight: '1px solid #e0e0e0',
                              width: `${100 / (Object.keys(facilityCounts).length)}%`, // 동일한 너비 적용
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {facilityCounts[key].facilityTypeName}
                          </TableCell>
                        ))}
                      <TableCell 
                        align="center" 
                        sx={{ 
                          fontWeight: 'bold', 
                          fontSize: '0.85rem',
                          backgroundColor: '#e3f2fd',
                          py: 1.5,
                          width: `${100 / (Object.keys(facilityCounts).length)}%` // 동일한 너비 적용
                        }}
                      >
                        총계
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      {Object.keys(facilityCounts)
                        .filter(key => key !== 'total')
                        .map((key) => (
                          <TableCell 
                            key={key} 
                            align="center" 
                            sx={{ 
                              fontSize: '0.95rem',
                              fontWeight: 500,
                              py: 2,
                              borderRight: '1px solid #e0e0e0'
                            }}
                          >
                            {facilityCounts[key].count}개
                          </TableCell>
                        ))}
                      <TableCell 
                        align="center" 
                        sx={{ 
                          fontSize: '0.95rem',
                          fontWeight: 700,
                          backgroundColor: '#e3f2fd',
                          py: 2
                        }}
                      >
                        {facilityCounts.total && facilityCounts.total.count}개
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>
      ) : null}

      {/* 메인 테이블 */}
      <Box sx={{ mb: 3, overflow: 'auto' }}>
        <TableContainer component={Paper} sx={{ minWidth: '100%', maxHeight: '60vh' }}>
          <Table stickyHeader sx={{ tableLayout: 'fixed' }}>
            <TableHead>
              <TableRow sx={{ height: '52px' }}>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#F8F9FA', width: '130px', height: '52px', padding: '6px 16px' }}>지점명</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#F8F9FA', width: '150px', height: '52px', padding: '6px 16px' }}>지점 전화</TableCell>
                {facilityTypes.map(type => (
                  <TableCell 
                    key={type.codeId} 
                    align="center" 
                    sx={{ 
                      fontWeight: 'bold', 
                      backgroundColor: '#F8F9FA',
                      padding: '6px 8px', // 패딩 줄임
                      width: '80px',
                      height: '52px'
                    }}
                  >
                      {type.codeName}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {(loading || facilityTypesLoading || inventoryLoading || !dataReady) ? (
                // 로딩 중일 때도 레이아웃 유지를 위해 더미 행 5개 생성
                Array(5).fill(0).map((_, index) => (
                  <TableRow key={`skeleton-${index}`} sx={{ height: '52px' }}>
                    <TableCell sx={{ padding: '6px 16px', height: '52px' }}>
                      <Box sx={{ height: '20px', bgcolor: '#f0f0f0', borderRadius: 1, animation: skeletonAnimation }} />
                    </TableCell>
                    <TableCell sx={{ padding: '6px 16px', height: '52px' }}>
                      <Box sx={{ height: '20px', bgcolor: '#f0f0f0', borderRadius: 1, animation: skeletonAnimation }} />
                    </TableCell>
                    {facilityTypes.map((type, typeIndex) => (
                      <TableCell key={`skeleton-cell-${index}-${typeIndex}`} align="center" sx={{ padding: '6px 8px', height: '36px' }}>
                        <Box sx={{ 
                          height: '20px', 
                          width: '24px', 
                          bgcolor: '#f0f0f0', 
                          borderRadius: 1, 
                          animation: skeletonAnimation,
                          margin: '0 auto'
                        }} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : displayedCompanies.length > 0 ? (
                // 데이터가 있을 때 표시
                displayedCompanies.map((company) => (
                  <TableRow key={company.id} hover sx={{ height: '36px' }}>
                    {renderStoreNameCell(company)}
                    <TableCell sx={{ padding: '6px 16px', height: '36px' }}>{company.phoneNumber}</TableCell>
                    {facilityTypes.map(type => renderTableCell(company, type))}
                  </TableRow>
                ))
              ) : (
                // 데이터가 없을 때 표시
                <TableRow sx={{ height: '36px' }}>
                  <TableCell colSpan={2 + facilityTypes.length} align="center" sx={{ py: 4 }}>
                    검색 조건에 맞는 수탁업체가 없습니다.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* 회사 목록 페이지네이션 */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, mb: 3 }}>
        <Pagination
          count={companyTotalPages}
          page={companyPage + 1}
          onChange={handleCompanyPageChange}
          color="primary"
        />
      </Box>

      {/* 하단 시설물 상세 목록 */}
      {selectedCompany && (
        <Paper sx={{ p: 3, mb: 3 }}>
          {/* 선택된 시설물의 재고 현황 */}
          {selectedInventoryItem && (
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  시설물 재고 현황
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {companies.find(c => c.id === selectedCompany)?.storeName} - {selectedInventoryItem.facilityTypeName}
                </Typography>
              </Box>
              
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', width: '20%' }}>기초재고</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', width: '20%' }}>입고수량</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', width: '20%' }}>출고수량</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', width: '20%' }}>현재재고</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', width: '20%' }}>최근 일마감일</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>{selectedInventoryItem.baseQuantity}</TableCell>
                      <TableCell>{selectedInventoryItem.recentInbound}</TableCell>
                      <TableCell>{selectedInventoryItem.recentOutbound}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: '#2e7d32' }}>{selectedInventoryItem.currentQuantity}</TableCell>
                      <TableCell>{formatInstallationDate(selectedInventoryItem.latestClosingDate)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              선택된 시설물 정보 (선택시 상세정보 확인가능)
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {companies.find(c => c.id === selectedCompany)?.storeName} 
              {!viewAllFacilities && selectedType && (
                ` - ${facilityTypes.find(t => t.codeId === selectedType)?.codeName}`
              )} 
              ({totalItems}개)
            </Typography>
          </Box>
          
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>수탁업체명</TableCell>
                  <TableCell>시설구분</TableCell>
                  <TableCell>품목</TableCell>
                  <TableCell>관리번호</TableCell>
                  <TableCell>설치일자</TableCell>
                  <TableCell>내용연수(개월)</TableCell>
                  <TableCell>상태</TableCell>
                  <TableCell>담당자</TableCell>
                  <TableCell>AS 접수일</TableCell>
                  <TableCell>작업완료일</TableCell>
                  <TableCell align="center">AS요청</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedFacilities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} align="center">
                      선택된 시설물이 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  selectedFacilities.map((facility, index) => (
                    <TableRow 
                      key={facility.facilityId}
                      hover
                      onClick={() => handleViewFacility(facility.facilityId)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>{facility.locationStoreName}</TableCell>
                      <TableCell>{facility.facilityTypeName}</TableCell>
                      <TableCell>{facility.brandName}</TableCell>
                      <TableCell>{facility.managementNumber}</TableCell>
                      <TableCell>{formatInstallationDate(facility.installationDate)}</TableCell>
                      <TableCell>{facility.usefulLifeMonths}</TableCell>
                      <TableCell>
                        <Chip 
                          label={facility.statusName} 
                          size="small" 
                          color={statusColorMap[facility.statusCode] || 'default'} 
                        />
                      </TableCell>
                      <TableCell>{facility.managerName || '-'}</TableCell>
                      <TableCell>{formatInstallationDate(facility.serviceRequestDate) || '-'}</TableCell>
                      <TableCell>{formatInstallationDate(facility.completionDate) || '-'}</TableCell>
                      <TableCell align="center">
                        {facility.hasActiveServiceRequest && !facility.isCompleted ? (
                          <Chip 
                            label={facility.serviceStatusName} 
                            size="small" 
                            color={
                              facility.serviceStatusCode === '002010_0001' ? 'default' : 
                              facility.serviceStatusCode === '002010_0002' ? 'warning' : 'info'
                            }
                          />
                        ) : (
                          facility.statusCode === '002003_0005' ? (
                            '-'
                          ) : (
                            <Button 
                              variant="contained" 
                              size="small"
                              color="primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/service-request/create/${facility.facilityId}`);
                              }}
                              sx={{ fontSize: '0.7rem', py: 0.5 }}
                            >
                              수리요청
                            </Button>
                          )
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          {selectedFacilities.length > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Pagination
                count={totalPages}
                page={page + 1}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}
        </Paper>
      )}
    </>
  );

  return (
    <Box sx={{ p: 3, backgroundColor: '#F8F8FE', minHeight: '100vh' }}>
      {/* 상단 헤더 */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 3 
      }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#3A3A3A' }}>
          현재 재고 현황
        </Typography>
      </Box>

      {/* 탭 네비게이션 */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="지점별 조회" id="facility-tab-0" aria-controls="facility-tabpanel-0" />
          <Tab label="시설물별 조회" id="facility-tab-1" aria-controls="facility-tabpanel-1" />
        </Tabs>
      </Box>

      {/* 탭 컨텐츠 */}
      <TabPanel value={tabValue} index={0}>
        {renderCompanyView()}
      </TabPanel>
      <TabPanel value={tabValue} index={1}>
        <FacilityTypeList />
      </TabPanel>

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
    </Box>
  );
};

export default FacilitiesList; 