import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Divider,
  Button,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ArticleIcon from "@mui/icons-material/Article";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HistoryIcon from "@mui/icons-material/History";
import EmailIcon from "@mui/icons-material/Email";
import { format } from "date-fns";

const ContractSignedPage = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get("token");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contractInfo, setContractInfo] = useState(null);

  // 재서명 요청 관련 상태 추가
  const [resignDialogOpen, setResignDialogOpen] = useState(false);
  const [resignReason, setResignReason] = useState("");
  const [resignRequestLoading, setResignRequestLoading] = useState(false);
  const [resignRequestResult, setResignRequestResult] = useState(null);

  // 비밀번호 이메일 전송 상태 추가
  const [passwordEmailSending, setPasswordEmailSending] = useState(false);
  const [passwordEmailResult, setPasswordEmailResult] = useState(null);
  const [signedPdfs, setSignedPdfs] = useState([]);

  // 토큰으로 계약 정보 조회
  useEffect(() => {
    const fetchContractInfo = async () => {
      if (!token) {
        setError("유효하지 않은 접근입니다.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(
          `http://localhost:8080/api/signature/signed-contract?token=${token}`
        );

        if (!response.ok) {
          const errorData = await response.json();
          console.log("API 오류 응답:", errorData);

          // 토큰 만료 오류 식별 (errorCode 또는 메시지 내용으로 판단)
          if (
            errorData.errorCode === "TOKEN_EXPIRED" ||
            errorData.errorCode === "INVALID_TOKEN" ||
            errorData.message?.includes("만료") ||
            errorData.message?.includes("유효하지 않은 토큰")
          ) {
            throw new Error(
              "이 링크는 더 이상 유효하지 않습니다.\n최신 이메일에서 받은 링크를 사용해주세요."
            );
          }

          throw new Error(
            errorData.message || "서명된 계약 정보를 불러오는데 실패했습니다."
          );
        }

        const data = await response.json();
        if (data.success) {
          console.log("계약 정보 응답:", data);
          console.log(
            "참여자 상태:",
            data.participant?.statusCode,
            data.participant?.statusName
          );
          console.log(
            "상태 코드 ID:",
            data.participant?.statusCode?.codeId ||
              data.participant?.statusCodeId
          );
          setContractInfo(data);
          
          // 계약 정보를 받은 후 서명된 PDF 목록도 함께 조회
          if (data.participant && data.participant.id) {
            await fetchSignedPdfs(data.participant.id);
          }
        } else {
          throw new Error(
            data.message || "서명된 계약 정보를 불러오는데 실패했습니다."
          );
        }
      } catch (err) {
        console.error("계약 정보 조회 오류:", err);
        setError(
          err.message ||
            "계약 정보를 불러오는데 실패했습니다. 다시 시도해주세요."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchContractInfo();
  }, [token]);

  // 서명된 PDF 목록 조회
  const fetchSignedPdfs = async (participantId) => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/contract-pdf/download-all-signed-pdfs/${participantId}`,
        { method: "GET" }
      );

      if (!response.ok) {
        console.error("서명된 PDF 목록 조회 실패");
        return;
      }

      const pdfList = await response.json();
      console.log("서명된 PDF 목록:", pdfList);
      setSignedPdfs(pdfList);
    } catch (error) {
      console.error("서명된 PDF 목록 조회 오류:", error);
    }
  };

  // 비밀번호 이메일 전송 함수
  const handleSendPasswordEmail = async () => {
    if (!signedPdfs || signedPdfs.length === 0) {
      setPasswordEmailResult({
        type: 'error',
        message: '서명된 PDF가 없습니다.'
      });
      return;
    }

    try {
      setPasswordEmailSending(true);
      setPasswordEmailResult(null);
      
      // 첫 번째 서명된 PDF의 ID 사용
      const firstPdfId = signedPdfs[0].pdfId;
      
      // URL에 토큰을 쿼리 파라미터로 추가
      const response = await fetch(
        `http://localhost:8080/api/contract-pdf/password/${firstPdfId}/send-email?token=${token}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('인증에 실패했습니다. 다시 로그인해주세요.');
        }
        
        const errorData = await response.json().catch(() => {
          // JSON 파싱 오류 시 기본 에러 메시지 사용
          return { message: '비밀번호 이메일 전송에 실패했습니다.' };
        });
        
        throw new Error(errorData.message || '비밀번호 이메일 전송에 실패했습니다.');
      }
      
      // 응답 처리 - JSON 파싱 오류 방지
      const data = await response.json().catch(() => {
        return { message: '비밀번호가 이메일로 전송되었습니다.' };
      });
      
      setPasswordEmailResult({
        type: 'success',
        message: data.message || '비밀번호가 이메일로 전송되었습니다.'
      });
      
    } catch (error) {
      console.error('비밀번호 이메일 전송 오류:', error);
      setPasswordEmailResult({
        type: 'error',
        message: error.message || '비밀번호 이메일 전송 중 오류가 발생했습니다.'
      });
    } finally {
      setPasswordEmailSending(false);
    }
  };

  // 알림 메시지 닫기
  const handleCloseAlert = () => {
    setPasswordEmailResult(null);
  };

  // 재서명 요청 다이얼로그 열기
  const handleOpenResignDialog = () => {
    setResignDialogOpen(true);
    setResignReason("");
    setResignRequestResult(null);
  };

  // 재서명 요청 다이얼로그 닫기
  const handleCloseResignDialog = () => {
    setResignDialogOpen(false);

    // 요청이 성공했을 경우 다이얼로그 닫을 때 새로고침
    if (resignRequestResult && resignRequestResult.success) {
      window.location.reload();
    }
  };

  // 재서명 요청 성공 후 확인 버튼 클릭 시 새로고침
  const handleConfirmAndRefresh = () => {
    setResignDialogOpen(false);
    window.location.reload();
  };

  // 재서명 요청 처리
  const handleRequestResign = async () => {
    if (!contractInfo || !contractInfo.contract || !contractInfo.participant) {
      alert("계약 정보가 유효하지 않습니다.");
      return;
    }

    try {
      setResignRequestLoading(true);

      const contractId = contractInfo.contract.id;
      const participantId = contractInfo.participant.id;

      // 재서명 요청 API 호출
      const response = await fetch(
        `http://localhost:8080/api/contracts/${contractId}/participants/${participantId}/request-resign`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: `reason=${encodeURIComponent(resignReason)}`,
        }
      );

      const data = await response.json();

      if (response.ok) {
        setResignRequestResult({
          success: true,
          message:
            data.message ||
            "재서명 요청이 성공적으로 등록되었습니다. 관리자 승인 후 재서명이 가능합니다.",
        });
      } else {
        throw new Error(
          data.message || "재서명 요청 처리 중 오류가 발생했습니다."
        );
      }
    } catch (error) {
      console.error("재서명 요청 오류:", error);
      setResignRequestResult({
        success: false,
        message:
          error.message ||
          "재서명 요청 중 오류가 발생했습니다. 다시 시도해주세요.",
      });
    } finally {
      setResignRequestLoading(false);
    }
  };

  // PDF 다운로드 처리
  const handleDownloadPdf = async (pdfId) => {
    try {
      if (!pdfId) {
        alert("PDF ID가 유효하지 않습니다.");
        return;
      }

      // ContractDetailPage.js와 일치하도록 API 경로 수정
      window.open(
        `http://localhost:8080/api/contract-pdf/download-signed-pdf/${pdfId}`,
        "_blank"
      );
    } catch (error) {
      console.error("PDF 다운로드 오류:", error);
      alert("PDF 다운로드 중 오류가 발생했습니다.");
    }
  };

  // 모든 PDF 다운로드 (ContractDetailPage.js와 동일한 방식으로 수정)
  const handleDownloadAllPdfs = async () => {
    try {
      if (
        !contractInfo ||
        !contractInfo.participant ||
        !contractInfo.participant.id
      ) {
        alert("참여자 정보가 유효하지 않습니다.");
        return;
      }

      const participantId = contractInfo.participant.id;

      // 서명된 모든 PDF 목록 조회
      const response = await fetch(
        `http://localhost:8080/api/contract-pdf/download-all-signed-pdfs/${participantId}`,
        { method: "GET" }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "PDF 조회 실패");
      }

      const signedPdfs = await response.json();

      if (!signedPdfs || signedPdfs.length === 0) {
        alert("다운로드할 서명된 문서가 없습니다.");
        return;
      }

      // 각 PDF 순차적으로 다운로드
      for (const pdfInfo of signedPdfs) {
        await new Promise((resolve) => setTimeout(resolve, 300)); // 다운로드 간격 설정

        const downloadResponse = await fetch(
          `http://localhost:8080${pdfInfo.downloadUrl}`,
          { method: "GET" }
        );

        if (!downloadResponse.ok) continue;

        const blob = await downloadResponse.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${pdfInfo.templateName || "계약서"}_${pdfInfo.pdfId}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("PDF 다운로드 오류:", error);
      alert("PDF 다운로드 중 오류가 발생했습니다: " + error.message);
    }
  };

  // 날짜 포맷 헬퍼 함수
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "yyyy-MM-dd HH:mm:ss");
    } catch (error) {
      return dateString;
    }
  };

  // 참여자의 상태 코드 확인 헬퍼 함수
  const isParticipantStatus = (statusToCheck) => {
    if (!contractInfo || !contractInfo.participant) return false;

    // 상태 코드 ID와 이름 매핑
    const STATUS_MAPPING = {
      "007001_0001": "승인 대기",
      "007001_0002": "승인 완료",
      "007001_0003": "서명 대기",
      "007001_0004": "서명 중",
      "007001_0005": "승인 거부",
      "007001_0006": "재서명 요청",
    };

    // 다양한 데이터 구조에 대응
    const statusCode =
      contractInfo.participant.statusCode?.codeId ||
      contractInfo.participant.statusCodeId ||
      (typeof contractInfo.participant.statusCode === "string"
        ? contractInfo.participant.statusCode
        : null);

    // 상태 이름을 통한 확인 (상태 코드가 없는 경우)
    const matchByName =
      (statusToCheck === "007001_0003" &&
        contractInfo.participant.statusName === "서명 대기") ||
      (statusToCheck === "007001_0006" &&
        contractInfo.participant.statusName === "재서명 요청");

    // 백엔드로부터 받은 상태 정보 로그
    console.log("상태 확인 개선:", {
      statusToCheck,
      statusCode,
      statusName: contractInfo.participant.statusName,
      matchByName,
      result: statusCode === statusToCheck || matchByName,
    });

    // 코드 ID 또는 상태 이름이 일치하는지 확인
    return statusCode === statusToCheck || matchByName;
  };

  // 로딩 중 표시
  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          flexDirection: "column",
          backgroundColor: "#F8F8FE",
        }}
      >
        <CircularProgress size={50} sx={{ mb: 3 }} />
        <Typography variant="h6">
          서명된 계약 정보를 불러오는 중입니다...
        </Typography>
      </Box>
    );
  }

  // 에러 표시
  if (error) {
    // 토큰 만료 오류인지 확인
    const isTokenExpired = error.includes(
      "이 링크는 더 이상 유효하지 않습니다"
    );

    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          flexDirection: "column",
          backgroundColor: "#F8F8FE",
          p: 3,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 2,
            textAlign: "center",
            maxWidth: 500,
            border: "1px solid #EEEEEE",
          }}
        >
          <Typography
            variant="h5"
            color={isTokenExpired ? "warning.main" : "error"}
            gutterBottom
          >
            {isTokenExpired ? "링크가 만료되었습니다" : "오류가 발생했습니다"}
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, whiteSpace: "pre-line" }}>
            {error}
          </Typography>
          {isTokenExpired ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Typography
                variant="body2"
                sx={{ color: "text.secondary", mb: 2 }}
              >
                재서명 요청이 승인되어 새로운 링크가 발급되었습니다.
                <br />
                이메일 또는 SMS를 확인하여 최신 링크로 접속해 주세요.
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  gap: 2,
                  justifyContent: "center",
                }}
              >
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() =>
                    window.open("https://mail.google.com", "_blank")
                  }
                  sx={{
                    borderRadius: "50%",
                    minWidth: "48px",
                    width: "48px",
                    height: "48px",
                    p: 0,
                    border: "1px solid #E0E0E0",
                    "&:hover": {
                      border: "1px solid #BDBDBD",
                      backgroundColor: "rgba(0, 0, 0, 0.04)",
                    },
                  }}
                >
                  <img
                    src="/images/google_logo.png"
                    alt="Gmail"
                    style={{
                      width: "35px",
                      height: "35px",
                      objectFit: "contain",
                    }}
                  />
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() =>
                    window.open("https://mail.naver.com", "_blank")
                  }
                  sx={{
                    borderRadius: "50%",
                    minWidth: "48px",
                    width: "48px",
                    height: "48px",
                    p: 0,
                    border: "1px solid #E0E0E0",
                    "&:hover": {
                      border: "1px solid #BDBDBD",
                      backgroundColor: "rgba(0, 0, 0, 0.04)",
                    },
                  }}
                >
                  <img
                    src="/images/naver_logo.png"
                    alt="네이버"
                    style={{
                      width: "35px",
                      height: "35px",
                      objectFit: "contain",
                    }}
                  />
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => window.open("https://mail.daum.net", "_blank")}
                  sx={{
                    borderRadius: "50%",
                    minWidth: "48px",
                    width: "48px",
                    height: "48px",
                    p: 0,
                    border: "1px solid #E0E0E0",
                    "&:hover": {
                      border: "1px solid #BDBDBD",
                      backgroundColor: "rgba(0, 0, 0, 0.04)",
                    },
                  }}
                >
                  <img
                    src="/images/daum_logo.png"
                    alt="다음"
                    style={{
                      width: "35px",
                      height: "35px",
                      objectFit: "contain",
                    }}
                  />
                </Button>
              </Box>
            </Box>
          ) : (
            <Button
              variant="outlined"
              onClick={() => (window.location.href = "/")}
            >
              홈으로 돌아가기
            </Button>
          )}
        </Paper>
      </Box>
    );
  }

  // 계약 정보가 없는 경우
  if (!contractInfo) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: "#F8F8FE",
        }}
      >
        <Typography variant="h6">계약 정보를 찾을 수 없습니다.</Typography>
      </Box>
    );
  }

  const { contract, participant, templates } = contractInfo;

  return (
    <Box
      sx={{
        p: 3,
        backgroundColor: "#F8F8FE",
        minHeight: "100vh",
      }}
    >
      {/* 상단 헤더 */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: 600,
            color: isParticipantStatus("007001_0003") ? "#FF9800" : "#3A3A3A",
          }}
        >
          {isParticipantStatus("007001_0003")
            ? "재서명 필요"
            : "계약서 서명 완료"}
        </Typography>
      </Box>

      {/* 서명 완료 상태 카드 */}
      <Paper
        elevation={0}
        sx={{ p: 4, mb: 3, borderRadius: 2, border: "1px solid #EEEEEE" }}
      >
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {isParticipantStatus("007001_0003")
                ? `${participant.name}님, 재서명이 필요합니다.`
                : `${participant.name}님, 계약서 확인 페이지입니다.`}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isParticipantStatus("007001_0003")
                ? "관리자가 재서명 요청을 승인했습니다. 새로운 서명 링크를 확인하여 다시 서명해주세요."
                : "아래에서 계약 정보를 확인하고 필요한 문서를 다운로드할 수 있습니다."}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" sx={{ mb: 1, color: "#666" }}>
              계약 제목
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {contract.title}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" sx={{ mb: 1, color: "#666" }}>
              계약 번호
            </Typography>
            <Typography variant="body1">
              {contract.contractNumber || "-"}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" sx={{ mb: 1, color: "#666" }}>
              {isParticipantStatus("007001_0003")
                ? "재서명 승인 시간"
                : "서명 시간"}
            </Typography>
            <Typography variant="body1">
              {isParticipantStatus("007001_0003")
                ? participant.resignApprovedAt
                  ? formatDate(participant.resignApprovedAt)
                  : "-"
                : formatDate(participant.signedAt)}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" sx={{ mb: 1, color: "#666" }}>
              계약 상태
            </Typography>
            <Chip
              label={participant.statusName || "서명 완료"}
              color={isParticipantStatus("007001_0003") ? "warning" : "primary"}
              size="small"
              sx={{
                fontWeight: 500,
                backgroundColor: isParticipantStatus("007001_0003")
                  ? "#FF9800"
                  : "#3182F6",
                color: "white",
              }}
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
          {isParticipantStatus("007001_0003") ? (
            // 서명 대기 상태일 때는 서명하기 안내 버튼 표시
            <Button
              variant="contained"
              color="warning"
              onClick={() =>
                (window.location.href = `/contract-sign/${contract.id}/participant/${participant.id}`)
              }
              sx={{
                borderRadius: "4px",
                fontSize: "0.75rem",
                height: "32px",
                fontWeight: 500,
                boxShadow: "none",
                bgcolor: "#FF9800",
                "&:hover": {
                  bgcolor: "#F57C00",
                },
              }}
            >
              서명하러 가기
            </Button>
          ) : (
            // 서명 완료 상태일 때는 재서명 요청 버튼 표시
            <Button
              variant="outlined"
              startIcon={<HistoryIcon />}
              onClick={handleOpenResignDialog}
              disabled={isParticipantStatus("007001_0006")}
              sx={{
                borderColor: "#E0E0E0",
                color: "#333333",
                "&:hover": {
                  borderColor: "#3182F6",
                  color: "#3182F6",
                  backgroundColor: "rgba(49, 130, 246, 0.04)",
                },
                "&.Mui-disabled": {
                  borderColor: "#E0E0E0",
                  color: "rgba(0, 0, 0, 0.26)",
                },
                borderRadius: "4px",
                fontSize: "0.75rem",
                height: "32px",
              }}
            >
              {isParticipantStatus("007001_0006")
                ? "재서명 요청 중"
                : "재서명 요청"}
            </Button>
          )}
        </Box>
      </Paper>

      {/* 계약 문서 카드 */}
      <Paper
        elevation={0}
        sx={{ p: 4, borderRadius: 2, border: "1px solid #EEEEEE" }}
      >
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
          계약 문서
        </Typography>

        {/* 계약 문서 섹션 */}
        {templates && templates.length > 0 ? (
          <Paper elevation={1} sx={{ p: 3, mt: 3, borderRadius: "8px" }}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <Typography variant="body1" sx={{ mb: 3, textAlign: "center" }}>
                총 {templates.length}개의 계약 문서가 있습니다.
              </Typography>

              {/* 서명 대기 상태가 아닐 때만 다운로드 버튼 표시 */}
              {!isParticipantStatus("007001_0003") ? (
                <>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                    <Button
                      variant="contained"
                      startIcon={<DownloadIcon />}
                      onClick={handleDownloadAllPdfs}
                      sx={{
                        bgcolor: "#3182F6",
                        color: "white",
                        "&:hover": {
                          bgcolor: "#1565C0",
                        },
                        borderRadius: "4px",
                        fontSize: "0.85rem",
                        height: "36px",
                        px: 2,
                        fontWeight: 500,
                        boxShadow: "none",
                      }}
                    >
                      모든 계약문서 다운로드
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<EmailIcon />}
                      onClick={handleSendPasswordEmail}
                      disabled={passwordEmailSending || !signedPdfs || signedPdfs.length === 0}
                      sx={{
                        borderColor: "#3182F6",
                        color: "#3182F6",
                        "&:hover": {
                          borderColor: "#1565C0",
                          bgcolor: "rgba(49, 130, 246, 0.04)",
                        },
                        borderRadius: "4px",
                        fontSize: "0.85rem",
                        height: "36px",
                        px: 2,
                        fontWeight: 500,
                      }}
                    >
                      {passwordEmailSending ? (
                        <>
                          <CircularProgress size={16} sx={{ mr: 1 }} />
                          이메일 전송 중...
                        </>
                      ) : (
                        "비밀번호 이메일로 재발급"
                      )}
                    </Button>
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{
                      display: "block",
                      mt: 2,
                      color: "text.secondary",
                      fontWeight: 500,
                      fontSize: "0.75rem",
                      textAlign: "center",
                    }}
                  >
                    * PDF 파일은 암호로 보호되어 있으며, 암호는 이메일로
                    전송되었습니다.
                  </Typography>
                </>
              ) : (
                <Typography
                  variant="body2"
                  sx={{
                    color: "#FF9800",
                    fontWeight: 500,
                    p: 2,
                    bgcolor: "rgba(255, 152, 0, 0.08)",
                    borderRadius: "4px",
                  }}
                >
                  재서명이 필요한 문서입니다. 서명을 완료해야 다운로드할 수
                  있습니다.
                </Typography>
              )}
            </Box>
          </Paper>
        ) : (
          <Paper
            elevation={1}
            sx={{ p: 3, mt: 3, borderRadius: "8px", textAlign: "center" }}
          >
            <Typography variant="body1" sx={{ color: "text.secondary" }}>
              현재 다운로드 가능한 계약 문서가 없습니다.
            </Typography>
          </Paper>
        )}

        <Box sx={{ mt: 4, textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary">
            이 페이지는 계약서 확인을 위해 2년간 접근 가능합니다.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            동일한 링크가 이메일과 SMS로도 발송되었습니다. 필요 시 저장해두세요.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            문의사항은 1599-7181로 연락주시기 바랍니다.
          </Typography>
        </Box>
      </Paper>

      {/* 재서명 요청 다이얼로그 */}
      <Dialog
        open={resignDialogOpen}
        onClose={!resignRequestLoading ? handleCloseResignDialog : undefined}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "8px",
            boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.08)",
            overflow: "hidden",
          },
        }}
      >
        <DialogTitle
          sx={{
            borderBottom: "1px solid #F0F0F0",
            py: 2,
            px: 3,
            fontSize: "1rem",
            fontWeight: 600,
          }}
        >
          계약서 재서명 요청
        </DialogTitle>
        <DialogContent sx={{ p: 3, mt: 1 }}>
          {!resignRequestResult ? (
            <>
              <Typography variant="body2" sx={{ mb: 3, color: "#505050" }}>
                이미 서명한 계약서에 대해 재서명을 요청합니다. 재서명 요청 시
                관리자 승인 후 새로운 서명 링크가 발송됩니다.
              </Typography>
              <Typography
                variant="body2"
                sx={{ mb: 1, color: "#505050", fontWeight: 500 }}
              >
                재서명 요청 사유
              </Typography>
              <TextField
                autoFocus
                fullWidth
                placeholder="재서명이 필요한 이유를 입력해주세요"
                value={resignReason}
                onChange={(e) => setResignReason(e.target.value)}
                multiline
                rows={3}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                      borderColor: "#E0E0E0",
                    },
                    "&:hover fieldset": {
                      borderColor: "#BDBDBD",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#3182F6",
                    },
                  },
                }}
              />
            </>
          ) : (
            <Box sx={{ textAlign: "center", py: 2 }}>
              {resignRequestResult.success ? (
                <>
                  <CheckCircleIcon
                    sx={{ fontSize: 48, color: "#4CAF50", mb: 2 }}
                  />
                  <Typography variant="h6" sx={{ mb: 1, color: "#333" }}>
                    재서명 요청이 접수되었습니다
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#666" }}>
                    {resignRequestResult.message}
                  </Typography>
                </>
              ) : (
                <>
                  <Typography variant="h6" color="error" sx={{ mb: 2 }}>
                    재서명 요청 실패
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#666" }}>
                    {resignRequestResult.message}
                  </Typography>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid #F0F0F0" }}>
          {!resignRequestResult ? (
            <>
              <Button
                onClick={handleCloseResignDialog}
                disabled={resignRequestLoading}
                sx={{
                  color: "#666",
                  "&:hover": {
                    backgroundColor: "rgba(0, 0, 0, 0.04)",
                  },
                  fontWeight: 500,
                }}
              >
                취소
              </Button>
              <Button
                onClick={handleRequestResign}
                variant="contained"
                disabled={resignRequestLoading || !resignReason.trim()}
                sx={{
                  bgcolor: "#3182F6",
                  "&:hover": {
                    bgcolor: "#1565C0",
                  },
                  fontWeight: 500,
                  boxShadow: "none",
                }}
              >
                {resignRequestLoading ? "요청 중..." : "재서명 요청"}
              </Button>
            </>
          ) : (
            <Button
              onClick={handleConfirmAndRefresh}
              variant="contained"
              sx={{
                bgcolor: "#3182F6",
                "&:hover": {
                  bgcolor: "#1565C0",
                },
                fontWeight: 500,
                boxShadow: "none",
              }}
            >
              확인
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* 비밀번호 이메일 전송 결과 알림 */}
      <Snackbar
        open={passwordEmailResult !== null}
        autoHideDuration={6000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseAlert}
          severity={passwordEmailResult?.type || "info"}
          sx={{ width: "100%" }}
        >
          {passwordEmailResult?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ContractSignedPage;
