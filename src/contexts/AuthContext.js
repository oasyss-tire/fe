import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 컴포넌트 마운트 시 세션 스토리지에서 토큰 확인
    const checkAuth = () => {
      const token = sessionStorage.getItem('token');
      const userData = sessionStorage.getItem('user');
      
      if (token && userData) {
        setIsAuthenticated(true);
        setUser(JSON.parse(userData));
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
      
      setLoading(false);
    };
    
    checkAuth();
  }, []);

  const login = (token, userData) => {
    
    // 사용자 정보에 role이 없는 경우 처리
    if (userData && !userData.role) {
      console.warn('사용자 정보에 role이 없습니다:', userData);
    }
    
    // 세션 스토리지에 토큰과 사용자 정보 저장
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('user', JSON.stringify(userData));
    
    // 권한 정보 별도 저장 (디버깅 및 접근 편의성을 위해)
    if (userData && userData.role) {
      sessionStorage.setItem('role', userData.role);
    }
    
    // 사용자 ID 별도 저장 (디버깅 및 접근 편의성을 위해)
    if (userData && userData.id) {
      sessionStorage.setItem('userId', userData.id.toString());
    }
    
    setIsAuthenticated(true);
    setUser(userData);
    
  };

  const logout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext; 