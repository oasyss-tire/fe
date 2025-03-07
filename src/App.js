import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import { Box, CircularProgress } from '@mui/material';
import Sidebar from './components/common/Sidebar';
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
import SavedPdfList from './components/common/SavedPdfList';


// 지연 로딩할 컴포넌트들
const CompanyList = React.lazy(() => import('./components/company/CompanyList'));
const UserList = React.lazy(() => import('./components/user/UserList'));
const UserManagement = React.lazy(() => import('./pages/UserManagement'));
const CompanyManagement = React.lazy(() => import('./pages/CompanyManagement'));
const FacilityList = React.lazy(() => import('./components/facility/FacilityList'));
const FacilityCreate = React.lazy(() => import('./components/facility/FacilityCreate'));
const FacilityDetail = React.lazy(() => import('./components/facility/FacilityDetail'));
const ServicePreparingPage = React.lazy(() => import('./components/common/ServicePreparingPage'));
const PdfUploader = React.lazy(() => import('./components/common/PdfUploader'));
const PdfViewerPage = React.lazy(() => import('./components/common/PdfViewerPage'));
const SignaturePdfViewer = React.lazy(() => import('./components/common/SignaturePdfViewer'));

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
  
  // PDF 관련 경로 체크 (viewer와 editor 모두 포함)
  const isPdfRoute = location.pathname.includes("/pdf-viewer") || 
                    location.pathname.includes("/pdf-editor");

  const isDashboardRoute = ["/contract-dashboard", "/facility-dashboard"].includes(location.pathname);

  return (
    <Box
      sx={{
        width: "100%",  // 전체 너비 사용
        margin: "0 auto",
        minHeight: "100vh",
        boxShadow: "0px 0px 10px rgba(0, 0, 0, 0.1)",
        backgroundColor: "#FFFFFF",
        position: "relative",
      }}
    >
      <Sidebar />
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
          <Route path="/pdf-upload" element={<PdfUploader />} />
          <Route path="/pdf-editor/:pdfId" element={<PdfViewerPage />} />
          <Route path="/pdf-viewer/:pdfId" element={<SignaturePdfViewer />} />
          <Route path="/saved-pdfs" element={<SavedPdfList />} />
          <Route 
            path="/contracts" 
            element={
              <ProtectedRoute>
                <ContractList />
              </ProtectedRoute>
            } 
          />
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