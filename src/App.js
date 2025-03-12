import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import { Box, CircularProgress } from '@mui/material';
import MainHome from './components/Home';
import './App.css';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { StyledEngineProvider } from '@mui/material/styles';
import ProtectedRoute from './components/common/ProtectedRoute';
import ContractList from './components/contract/ContractList';
import ContractUpload from './components/contract/ContractUpload';
import ContractDetail from './components/contract/ContractDetail';
import { PdfProvider } from './context/PdfContext';
import ContractTemplate from './components/common/ContractTemplate';
import Sidebar from './components/common/Sidebar';
import Settings from './components/settings/Settings';

const DRAWER_WIDTH = 240;

// 지연 로딩할 컴포넌트들
const CompanyList = React.lazy(() => import('./components/company/CompanyList'));
const UserList = React.lazy(() => import('./components/user/UserList'));
const UserManagement = React.lazy(() => import('./pages/UserManagement'));
const CompanyManagement = React.lazy(() => import('./pages/CompanyManagement'));
const FacilityList = React.lazy(() => import('./components/facility/FacilityList'));
const FacilityCreate = React.lazy(() => import('./components/facility/FacilityCreate'));
const FacilityDetail = React.lazy(() => import('./components/facility/FacilityDetail'));
const ServicePreparingPage = React.lazy(() => import('./components/common/ServicePreparingPage'));
const ContractPdfUploader = React.lazy(() => import('./components/common/ContractPdfUploader'));
const PdfViewerPage = React.lazy(() => import('./components/common/PdfViewerPage'));
const SignaturePdfViewer = React.lazy(() => import('./components/common/SignaturePdfViewer'));
const ContractSend = React.lazy(() => import('./components/contract/ContractSend'));
const FacilitiesList = React.lazy(() => import('./components/facility/FacilitiesList'));
const FacilitiesRegister = React.lazy(() => import('./components/facility/FacilitiesRegister'));
const FacilitiesService = React.lazy(() => import('./components/facility/FacilitiesService'));
const ContractDetailPage = React.lazy(() => import('./components/contract/ContractDetailPage'));
const FacilityDashboard = React.lazy(() => import('./components/facility/FacilityDashboard'));
const CodeManagement = React.lazy(() => import('./components/settings/CodeManagement'));
const PermissionManagement = React.lazy(() => import('./components/settings/PermissionManagement'));

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
  
  const hideSidebarPaths = ['/pdf-editor', '/pdf-viewer'];
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
            <Route path="/" element={<MainHome />} />
            <Route path="/companies" element={<CompanyList />} />
            <Route path="/companies/:companyId" element={<CompanyManagement />} />
            <Route path="/users" element={<UserList />} />
            <Route path="/users/:userId" element={<UserManagement />} />
            <Route path="/facility" element={<FacilityList />} />
            <Route path="/facility/create" element={<FacilityCreate />} />
            <Route path="/facility/:id" element={<FacilityDetail />} />
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
            <Route path="/contract-detail/:id" element={<ContractDetailPage />} />
            <Route path="/facility-dashboard" element={<FacilityDashboard />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/settings/codes" element={<CodeManagement />} />
            <Route path="/settings/permissions" element={<PermissionManagement />} />
            <Route 
              path="/contracts/:id"
              element={
                <ProtectedRoute>
                  <ContractDetail />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/contract/upload" 
              element={
                <ProtectedRoute>
                  <ContractUpload />
                </ProtectedRoute>
              } 
            />
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
            <PdfProvider>
              <AppContent />
            </PdfProvider>
          </LocalizationProvider>
        </ThemeProvider>
      </Router>
    </StyledEngineProvider>
  );
}

export default App; 