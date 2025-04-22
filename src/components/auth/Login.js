import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  CircularProgress,
  InputAdornment,
  IconButton,
  Link,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const Login = () => {
  const [credentials, setCredentials] = useState({
    userId: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "로그인에 실패했습니다.");
      }


      // 토큰 및 사용자 정보 저장
      login(data.token, data.user);

      // 로그인 성공 후 메인 페이지로 이동
      navigate("/contract-list");
    } catch (error) {
      console.error("로그인 오류:", error);

      // 오류 메시지 설정
      if (error.message.includes("존재하지 않는 사용자")) {
        setError("존재하지 않는 사용자입니다.");
      } else if (error.message.includes("비밀번호가 틀렸습니다")) {
        setError("비밀번호가 틀렸습니다.");
      } else {
        setError("로그인 중 오류가 발생했습니다. 다시 시도해주세요.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#f8f9fa",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        py: 4,
      }}
    >
      {/* 로고 영역 - 중앙 상단에 배치 */}
      <Box
        component="img"
        src="/images/header_logo.png"
        alt="타이어뱅크 로고"
        sx={{
          height: "60px",
          mb: 5,
        }}
      />

      {/* 로그인 폼 */}
      <Paper
        elevation={1}
        sx={{
          width: "100%",
          maxWidth: 450,
          p: 4,
          borderRadius: 2,
          border: "1px solid #e0e0e0",
        }}
      >
        <Box sx={{ mb: 3, textAlign: "center" }}>
          <Typography
            variant="h5"
            component="h1"
            sx={{ fontWeight: 600, mb: 1 }}
          >
            로그인
          </Typography>
          <Typography variant="body2" color="text.secondary">
            전자 문서관리 시작해 보세요
          </Typography>
        </Box>

        <form onSubmit={handleLogin}>
          <TextField
            fullWidth
            placeholder="아이디"
            name="userId"
            value={credentials.userId}
            onChange={handleChange}
            variant="outlined"
            required
            autoFocus
            sx={{
              mb: 2,
              "& .MuiOutlinedInput-root": {
                "& fieldset": {
                  borderColor: "#e0e0e0",
                },
                "&:hover fieldset": {
                  borderColor: "#bdbdbd",
                },
              },
            }}
          />

          <TextField
            fullWidth
            placeholder="비밀번호"
            name="password"
            type={showPassword ? "text" : "password"}
            value={credentials.password}
            onChange={handleChange}
            variant="outlined"
            required
            sx={{
              mb: 1,
              "& .MuiOutlinedInput-root": {
                "& fieldset": {
                  borderColor: "#e0e0e0",
                },
                "&:hover fieldset": {
                  borderColor: "#bdbdbd",
                },
              },
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={handleTogglePasswordVisibility}
                    edge="end"
                    size="small"
                  >
                    {showPassword ? (
                      <VisibilityOff fontSize="small" />
                    ) : (
                      <Visibility fontSize="small" />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Link
            href="#"
            variant="body2"
            sx={{
              display: "inline-block",
              mb: 2,
              fontSize: "0.8rem",
              color: "#0073b1",
              textDecoration: "none",
              "&:hover": {
                textDecoration: "underline",
              },
            }}
          >
            비밀번호를 잊으셨나요?
          </Link>

          {error && (
            <Typography
              color="error"
              variant="body2"
              sx={{ mb: 2, fontSize: "0.8rem" }}
            >
              {error}
            </Typography>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={isLoading}
            sx={{
              py: 1.5,
              mt: 1,
              backgroundColor: "#0073b1",
              "&:hover": {
                backgroundColor: "#006097",
              },
              "&.Mui-disabled": {
                backgroundColor: "#0073b1",
                opacity: 0.7,
              },
              textTransform: "none",
              fontWeight: 600,
              borderRadius: "4px",
              position: "relative",
            }}
          >
            {isLoading ? (
              <>
                <CircularProgress
                  size={20}
                  sx={{
                    color: "white",
                    position: "absolute",
                    left: "30%",
                  }}
                />
                로그인 중...
              </>
            ) : (
              "로그인"
            )}
          </Button>
        </form>
      </Paper>

      {/* 회원가입 링크 */}
      {/* <Box 
        sx={{ 
          mt: 3, 
          textAlign: 'center'
        }}
      >
        <Link
          component="button"
          variant="body2"
          onClick={() => navigate('/signup')}
          sx={{ 
            fontWeight: 600,
            color: '#0073b1',
            textDecoration: 'none',
            '&:hover': {
              textDecoration: 'underline',
            }
          }}
        >
          회원 가입
        </Link>
      </Box> */}
    </Box>
  );
};

export default Login;
