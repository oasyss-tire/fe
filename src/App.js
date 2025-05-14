import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import { Box, CircularProgress } from '@mui/material';
import MainHome from './components/Home';
import './App.css';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { StyledEngineProvider } from '@mui/material/styles';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import { AuthProvider } from './contexts/AuthContext';
import ContractList from './components/contract/ContractList';
import { PdfProvider } from './contexts/PdfContext';
import ContractTemplate from './components/contract/ContractTemplate';
import Sidebar from './components/common/Sidebar';
import Settings from './components/settings/Settings';

const DRAWER_WIDTH = 240;

// 지연 로딩할 컴포넌트들
const CompanyList = React.lazy(() => import('./components/company/CompanyList'));
const CompanyCreate = React.lazy(() => import('./components/company/CompanyCreate'));
const CompanyDetail = React.lazy(() => import('./components/company/CompanyDetail'));
const UserList = React.lazy(() => import('./components/auth/UserList'));
const UserManagement = React.lazy(() => import('./components/auth/UserDetailPage'));
const UserMyPage = React.lazy(() => import('./components/auth/UserMyPage'));
const ServicePreparingPage = React.lazy(() => import('./components/common/ServicePreparingPage'));
const ContractPdfUploader = React.lazy(() => import('./components/contract/ContractPdfUploader'));
const PdfViewerPage = React.lazy(() => import('./components/contract/PdfViewerPage'));
const SignaturePdfViewer = React.lazy(() => import('./components/contract/SignaturePdfViewer'));
const ContractSend = React.lazy(() => import('./components/contract/ContractSend'));
const FacilitiesList = React.lazy(() => import('./components/facility/FacilitiesList'));
const FacilitiesRegister = React.lazy(() => import('./components/facility/FacilitiesRegister'));
const FacilitiesService = React.lazy(() => import('./components/facility/FacilitiesService'));
const FacilitiesDetail = React.lazy(() => import('./components/facility/FacilitiesDetail'));
const ContractDetailPage = React.lazy(() => import('./components/contract/ContractDetailPage'));
const FacilityDashboard = React.lazy(() => import('./components/facility/FacilityDashboard'));
const CodeManagement = React.lazy(() => import('./components/settings/CodeManagement'));
const PermissionManagement = React.lazy(() => import('./components/settings/PermissionManagement'));
const ContractSignedPage = React.lazy(() => import('./components/contract/ContractSignedPage'));
const ContractCorrectionRequest = React.lazy(() => import('./components/contract/ContractCorrectionRequest'));
const ContractCorrectionResponsePage = React.lazy(() => import('./components/contract/ContractCorrectionResponsePage'));
const PreviewPdfViewer = React.lazy(() => import('./components/contract/PreviewPdfViewer'));
const ServiceRequestCreate = React.lazy(() => import('./components/facility/ServiceRequestCreate'));
const ServiceRequestList = React.lazy(() => import('./components/facility/ServiceRequestList'));
const ServiceRequestDetail = React.lazy(() => import('./components/facility/ServiceRequestDetail'));
const FacilityTransfer = React.lazy(() => import('./components/facility/FacilityTransfer'));
const FacilityHistoryPage = React.lazy(() => import('./components/facility/FacilityHistoryPage'));
const ContractEventLogPage = React.lazy(() => import('./components/contract/ContractEventLogPage'));
const EditTemplatePage = React.lazy(() => import('./components/contract/EditTemplatePage'));

// 로딩 컴포넌트
const LoadingFallback = () => (
  <Box 
    sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      height: '100vh'
    }}
  >
    <CircularProgress />
  </Box>
);

// AppContent 컴포넌트를 새로 만들어서 useLocation 사용
const AppContent = () => {
  const location = useLocation();
  
  const hideSidebarPaths = ['/pdf-editor', '/pdf-viewer', '/login', '/signup', '/contract-correction-request',
    '/contract-correction-request/:contractId/participant/:participantId', '/correction-request', '/contract-preview', '/edit-template'];
  const shouldHideSidebar = hideSidebarPaths.some(path => 
    location.pathname.includes(path)
  );

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Sidebar 고정 */}
      {!shouldHideSidebar && (
        <Box sx={{ 
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 1000,
        }}>
          <Sidebar />
        </Box>
      )}

      {/* 메인 컨텐츠 영역 */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          marginLeft: !shouldHideSidebar ? `${DRAWER_WIDTH}px` : 0,
          minHeight: '100vh',
          overflow: 'auto',
        }}
      >
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* 로그인 페이지 - 인증 불필요 */}
            <Route path="/login" element={<Login />} />
            
            {/* 회원가입 페이지 - 인증 불필요 */}
            <Route path="/signup" element={<Signup />} />
            
            {/* 비회원 서명 페이지 - 토큰 기반 인증 (인증 불필요) */}
            <Route path="/contract-sign" element={<SignaturePdfViewer />} />
            
            {/* 비회원 서명 결과 페이지 (인증 불필요) */}
            <Route path="/contract-signed" element={<ContractSignedPage />} />
            
            {/* 비회원 재서명 처리 페이지 (인증 불필요) */}
            <Route path="/correction-request" element={<ContractCorrectionResponsePage />} />
            
            {/* 보호된 라우트 - 인증 필요 */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<MainHome />} />
              <Route path="/companies" element={<CompanyList />} />
              <Route path="/companies/create" element={<CompanyCreate />} />
              <Route path="/companies/:companyId" element={<CompanyDetail />} />
              <Route path="/users" element={<UserList />} />
              <Route path="/users/:userId" element={<UserManagement />} />
              <Route path="/users/mypage" element={<UserMyPage />} />
              <Route path="/service-preparing" element={<ServicePreparingPage />} />
              <Route path="/contract-upload" element={<ContractPdfUploader />} />
              <Route path="/pdf-editor/:pdfId" element={<PdfViewerPage />} />
              <Route path="/contract-sign/:contractId/participant/:participantId" element={<SignaturePdfViewer />} />
              <Route path="/contract-templates" element={<ContractTemplate />} />
              <Route path="/contract-list" element={<ContractList />} />
              <Route path="/contract-send" element={<ContractSend />} />
              <Route path="/facility-list" element={<FacilitiesList />} />
              <Route path="/facility-register" element={<FacilitiesRegister />} />
              <Route path="/facility-service" element={<FacilitiesService />} />
              <Route path="/facility-detail/:id" element={<FacilitiesDetail />} />
              <Route path="/facility-transfer" element={<FacilityTransfer />} />
              <Route path="/contract-detail/:id" element={<ContractDetailPage />} />
              <Route path="/facility-dashboard" element={<FacilityDashboard />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/settings/codes" element={<CodeManagement />} />
              <Route path="/settings/permissions" element={<PermissionManagement />} />
              <Route path="/mypage" element={<UserMyPage />} />
              <Route path="/contract-correction-request/:contractId/participant/:participantId" element={<ContractCorrectionRequest />} />
              <Route path="/contract-preview/:contractId" element={<PreviewPdfViewer />} />
              <Route path="/contract-preview/:contractId/participant/:participantId/pdf/:pdfId" element={<PreviewPdfViewer />} />
              <Route path="/service-request/create" element={<ServiceRequestCreate />} />
              <Route path="/service-request/create/:facilityId" element={<ServiceRequestCreate />} />
              <Route path="/service-request/list" element={<ServiceRequestList />} />
              <Route path="/service-request/:id" element={<ServiceRequestDetail />} />
              <Route path="/facility-history" element={<FacilityHistoryPage />} />
              <Route path="/contract-log" element={<ContractEventLogPage />} />
              <Route path="/edit-template/:templateId" element={<EditTemplatePage />} />
            </Route>
          </Routes>
        </Suspense>
      </Box>
    </Box>
  );
};

// App 컴포넌트 수정
function App() {
  return (
    <StyledEngineProvider injectFirst>
      <Router>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <AuthProvider>
              <PdfProvider>
                <AppContent />
              </PdfProvider>
            </AuthProvider>
          </LocalizationProvider>
        </ThemeProvider>
      </Router>
    </StyledEngineProvider>
  );
}

export default App; 