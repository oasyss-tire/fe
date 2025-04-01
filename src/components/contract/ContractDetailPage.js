import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography, //
  Paper, //
  LinearProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  IconButton,
  Divider,
  Chip,
  Menu,
  MenuItem,
  Snackbar,
  Alert,
} from "@mui/material";
import {
  LocationOn as LocationOnIcon,
  Label as LabelIcon,
  Draw as DrawIcon,
  Download as DownloadIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Visibility as VisibilityIcon,
  History as HistoryIcon,
  FilePresent as FilePresentIcon,
  Upload as UploadIcon,
  AttachFile as AttachFileIcon,
  PhotoCamera as PhotoCameraIcon,
  InsertDriveFile as InsertDriveFileIcon,
} from "@mui/icons-material";

const ContractDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [approveLoading, setApproveLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [approveComment, setApproveComment] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  // 상세 정보 다이얼로그 관련 상태 추가
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailType, setDetailType] = useState("");
  const [detailContent, setDetailContent] = useState("");

  // 재서명 승인 관련 상태 추가
  const [resignApproveDialogOpen, setResignApproveDialogOpen] = useState(false);
  const [resignApproveLoading, setResignApproveLoading] = useState(false);
  const [approver, setApprover] = useState("");

  // 첨부파일 관련 상태 추가
  const [participantDocuments, setParticipantDocuments] = useState({});
  const [docLoading, setDocLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  // 파일 업로드 메뉴 관련 상태
  const [uploadMenuAnchor, setUploadMenuAnchor] = useState(null);
  const [selectedDoc, setSelectedDoc] = useState(null);

  // 파일 입력을 위한 refs
  const fileInputRef = useRef(null);

  // 웹캠 관련 상태 추가
  const [cameraDialogOpen, setCameraDialogOpen] = useState(false);
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // 계약 상세 정보 조회
  useEffect(() => {
    const fetchContractDetail = async () => {
      try {
        const response = await fetch(
          `http://localhost:8080/api/contracts/${id}`
        );
        if (!response.ok) throw new Error("계약 조회 실패");
        const data = await response.json();

        // 참여자 정보 및 상태코드 세부 로깅
        console.log("전체 계약 정보:", data);
        console.log("참여자 목록:", data.participants);

        // 각 참여자의 상태 정보 확인
        if (data.participants && data.participants.length > 0) {
          data.participants.forEach((participant, index) => {
            console.log(
              `참여자 ${index + 1} [${participant.name}] 상태 정보:`,
              {
                statusCodeId: participant.statusCodeId,
                statusName: participant.statusName,
                signed: participant.signed,
                approved: participant.approved,
                rejectionReason: participant.rejectionReason,
              }
            );
          });
        }

        setContract(data);

        // 계약 조회 후 문서 정보도 함께 조회
        fetchContractDocuments(id);
      } catch (error) {
        console.error("계약 조회 중 오류:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchContractDetail();
  }, [id]);

  // 첨부파일 정보 조회
  const fetchContractDocuments = async (contractId) => {
    try {
      setDocLoading(true);
      const response = await fetch(
        `http://localhost:8080/api/contracts/${contractId}/documents`
      );
      if (!response.ok) throw new Error("첨부파일 조회 실패");
      const data = await response.json();
      console.log("참여자별 문서 목록:", data);
      setParticipantDocuments(data);
    } catch (error) {
      console.error("첨부파일 조회 중 오류:", error);
    } finally {
      setDocLoading(false);
    }
  };

  // 문서 다운로드 처리
  const handleDocumentDownload = async (documentId, fileName) => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/contracts/documents/${documentId}/download`
      );
      if (!response.ok) {
        throw new Error("문서 다운로드 실패");
      }

      // 파일 다운로드 처리
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName || `document_${documentId}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("문서 다운로드 중 오류:", error);
      alert("문서 다운로드 중 오류가 발생했습니다.");
    }
  };

  // 문서 파일 미리보기 핸들러 추가
  const handleDocumentPreview = async (documentId, fileName) => {
    try {
      // 미리보기 URL 생성
      const previewUrl = `http://localhost:8080/api/contracts/documents/${documentId}/preview`;

      // 새 창에서 미리보기 열기
      window.open(previewUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("파일 미리보기 오류:", error);
      alert("파일 미리보기 중 오류가 발생했습니다.");
    }
  };

  // 업로드 메뉴 열기
  const handleOpenUploadMenu = (event, participant, doc) => {
    setUploadMenuAnchor(event.currentTarget);
    setSelectedDoc({ participant, doc });
  };

  // 업로드 메뉴 닫기
  const handleCloseUploadMenu = () => {
    setUploadMenuAnchor(null);
  };

  // 파일 찾기로 업로드
  const handleFileUpload = () => {
    handleCloseUploadMenu();
    fileInputRef.current.click();
  };

  // 카메라로 업로드
  const handleCameraUpload = () => {
    handleCloseUploadMenu();
    // PC 환경에서는 웹캠 다이얼로그 열기
    setCameraDialogOpen(true);

    // 웹캠 스트림 시작
    startCameraStream();
  };

  // 웹캠 스트림 시작
  const startCameraStream = async () => {
    try {
      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user", // 전면 카메라 (PC 웹캠)
        },
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(
        constraints
      );
      setStream(mediaStream);

      // 비디오 요소에 스트림 연결
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error("웹캠 접근 오류:", error);
      alert("웹캠에 접근할 수 없습니다. 권한을 확인해주세요.");
      setCameraDialogOpen(false);
    }
  };

  // 웹캠 스트림 중지
  const stopCameraStream = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  // 카메라 다이얼로그 닫기
  const handleCloseCameraDialog = () => {
    stopCameraStream();
    setCameraDialogOpen(false);
  };

  // 사진 촬영
  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // 비디오 프레임 크기로 캔버스 설정
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // 캔버스에 현재 비디오 프레임 그리기
    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // 캔버스 이미지를 Blob으로 변환
    canvas.toBlob(
      async (blob) => {
        if (!blob || !selectedDoc) return;

        // Blob을 File 객체로 변환
        const file = new File([blob], `webcam_capture_${Date.now()}.jpg`, {
          type: "image/jpeg",
        });

        // 파일 업로드
        await uploadFile(file, selectedDoc.participant, selectedDoc.doc);

        // 다이얼로그 닫기
        handleCloseCameraDialog();
      },
      "image/jpeg",
      0.95
    );
  };

  // 파일 선택 시 처리
  const handleFileChange = async (event) => {
    if (!event.target.files || event.target.files.length === 0) return;

    const file = event.target.files[0];
    if (!selectedDoc) return;

    await uploadFile(file, selectedDoc.participant, selectedDoc.doc);

    // 파일 입력 초기화
    event.target.value = null;
  };

  // 파일 업로드 처리
  const uploadFile = async (file, participant, doc) => {
    try {
      setUploadLoading(true);
      setUploadError(null);

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `http://localhost:8080/api/contracts/${contract.id}/participants/${participant.id}/documents/${doc.documentCodeId}`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "파일 업로드 실패");
      }

      const result = await response.json();
      console.log("업로드 성공:", result);

      // 업로드 성공 후 문서 목록 다시 조회
      await fetchContractDocuments(contract.id);
      setUploadSuccess(true);

      // 3초 후 성공 메시지 숨기기
      setTimeout(() => {
        setUploadSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("파일 업로드 중 오류:", error);
      setUploadError(error.message);

      // 3초 후 에러 메시지 숨기기
      setTimeout(() => {
        setUploadError(null);
      }, 3000);
    } finally {
      setUploadLoading(false);
    }
  };

  // 에러 알림 닫기
  const handleCloseErrorAlert = () => {
    setUploadError(null);
  };

  // 성공 알림 닫기
  const handleCloseSuccessAlert = () => {
    setUploadSuccess(false);
  };

  // 서명 버튼 클릭 핸들러
  const handleSignatureClick = (participant) => {
    window.location.href = `/contract-sign/${contract.id}/participant/${participant.id}`;
  };

  // 승인 다이얼로그 열기
  const handleOpenApproveDialog = (participant) => {
    setSelectedParticipant(participant);
    setApproveComment("");
    setApproveDialogOpen(true);
  };

  // 승인 다이얼로그 닫기
  const handleCloseApproveDialog = () => {
    setApproveDialogOpen(false);
    setSelectedParticipant(null);
  };

  // 거부 다이얼로그 열기
  const handleOpenRejectDialog = (participant) => {
    setSelectedParticipant(participant);
    setRejectReason("");
    setRejectDialogOpen(true);
  };

  // 거부 다이얼로그 닫기
  const handleCloseRejectDialog = () => {
    setRejectDialogOpen(false);
    setSelectedParticipant(null);
  };

  // 재서명 승인 다이얼로그 열기
  const handleOpenResignApproveDialog = (participant) => {
    setSelectedParticipant(participant);
    setApprover(""); // 승인자 이름 초기화
    setResignApproveDialogOpen(true);
  };

  // 재서명 승인 다이얼로그 닫기
  const handleCloseResignApproveDialog = () => {
    setResignApproveDialogOpen(false);
    setSelectedParticipant(null);
  };

  // 재서명 승인 처리
  const handleApproveResign = async () => {
    if (!selectedParticipant || !approver.trim()) {
      alert("승인자 이름을 입력해주세요.");
      return;
    }

    try {
      setResignApproveLoading(true);

      const url = `http://localhost:8080/api/contracts/${contract.id}/participants/${selectedParticipant.id}/approve-resign`;
      const response = await fetch(
        `${url}?approver=${encodeURIComponent(approver)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message || "재서명 승인 처리 중 오류가 발생했습니다"
        );
      }

      // 승인 성공 후 알림
      alert(
        `${selectedParticipant.name} 참여자의 재서명 요청이 승인되었습니다.`
      );
      handleCloseResignApproveDialog();

      // 계약 정보 다시 조회
      const fetchContractDetail = async () => {
        try {
          const response = await fetch(
            `http://localhost:8080/api/contracts/${id}`
          );
          if (!response.ok) throw new Error("계약 조회 실패");
          const data = await response.json();
          setContract(data);
        } catch (error) {
          console.error("계약 조회 중 오류:", error);
        }
      };

      await fetchContractDetail();
    } catch (error) {
      console.error("재서명 승인 처리 중 오류:", error);
      alert(error.message);
    } finally {
      setResignApproveLoading(false);
    }
  };

  // 참여자 승인 처리
  const handleApproveParticipant = async () => {
    if (!selectedParticipant) return;

    try {
      setApproveLoading(true);
      const url = `http://localhost:8080/api/contracts/${contract.id}/participants/${selectedParticipant.id}/approve`;
      const queryParams = approveComment
        ? `?comment=${encodeURIComponent(approveComment)}`
        : "";

      const response = await fetch(`${url}${queryParams}`, {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message || "승인 처리 중 오류가 발생했습니다"
        );
      }

      // 승인 성공 후 상세 정보 다시 조회
      alert(`${selectedParticipant.name} 참여자의 서명이 승인되었습니다.`);
      handleCloseApproveDialog();

      // 계약 정보 다시 조회
      const fetchContractDetail = async () => {
        try {
          const response = await fetch(
            `http://localhost:8080/api/contracts/${id}`
          );
          if (!response.ok) throw new Error("계약 조회 실패");
          const data = await response.json();
          setContract(data);
        } catch (error) {
          console.error("계약 조회 중 오류:", error);
        }
      };

      await fetchContractDetail();
    } catch (error) {
      console.error("참여자 승인 처리 중 오류:", error);
      alert(error.message);
    } finally {
      setApproveLoading(false);
    }
  };

  // 참여자 거부 처리
  const handleRejectParticipant = async () => {
    if (!selectedParticipant || !rejectReason.trim()) {
      alert("거부 사유를 입력해주세요.");
      return;
    }

    try {
      setRejectLoading(true);
      const url = `http://localhost:8080/api/contracts/${contract.id}/participants/${selectedParticipant.id}/reject`;
      const queryParams = `?reason=${encodeURIComponent(rejectReason)}`;

      const response = await fetch(`${url}${queryParams}`, {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message || "거부 처리 중 오류가 발생했습니다"
        );
      }

      // 거부 성공 후 상세 정보 다시 조회
      alert(`${selectedParticipant.name} 참여자의 서명이 거부되었습니다.`);
      handleCloseRejectDialog();

      // 계약 정보 다시 조회
      const fetchContractDetail = async () => {
        try {
          const response = await fetch(
            `http://localhost:8080/api/contracts/${id}`
          );
          if (!response.ok) throw new Error("계약 조회 실패");
          const data = await response.json();
          setContract(data);
        } catch (error) {
          console.error("계약 조회 중 오류:", error);
        }
      };

      await fetchContractDetail();
    } catch (error) {
      console.error("참여자 거부 처리 중 오류:", error);
      alert(error.message);
    } finally {
      setRejectLoading(false);
    }
  };

  // 다운로드 핸들러 추가
  const handleDownloadSignedPdf = async (pdfId) => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/contract-pdf/download-signed-pdf/${pdfId}`,
        { method: "GET" }
      );

      if (!response.ok) throw new Error("PDF 다운로드 실패");

      // 파일 다운로드 처리
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `signed_${pdfId}`; // 파일명 설정
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert("PDF 다운로드 중 오류가 발생했습니다.");
    }
  };

  // 모든 서명된 PDF 다운로드 핸들러 추가
  const handleDownloadAllSignedPdfs = async (participantId) => {
    try {
      // 서명된 모든 PDF 목록 조회
      const response = await fetch(
        `http://localhost:8080/api/contract-pdf/download-all-signed-pdfs/${participantId}`,
        { method: "GET" }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData || "PDF 조회 실패");
      }

      const signedPdfs = await response.json();

      if (signedPdfs.length === 0) {
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
        a.download = `${pdfInfo.templateName}_${pdfInfo.pdfId}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Error downloading all PDFs:", error);
      alert("PDF 다운로드 중 오류가 발생했습니다: " + error.message);
    }
  };

  // 계약 상태에 따른 색상 정보 반환 함수 추가
  const getStatusColor = (contract) => {
    // 기본 색상
    let color = "#1976d2";
    let bgColor = "#E8F3FF";

    // statusCodeId가 있는 경우
    if (contract.statusCodeId) {
      switch (contract.statusCodeId) {
        case "001002_0001": // 승인대기
          color = "#FF9800";
          bgColor = "#FFF3E0";
          break;
        case "001002_0002": // 계약완료
          color = "#3182F6";
          bgColor = "#E8F3FF";
          break;
        case "001002_0003": // 임시저장
          color = "#9E9E9E";
          bgColor = "#F5F5F5";
          break;
        case "001002_0004": // 서명진행중
          color = "#FF9800";
          bgColor = "#FFF3E0";
          break;
        default:
          break;
      }
    } else {
      // progressRate에 따른 fallback 색상
      if (contract.progressRate === 100) {
        color = "#3182F6";
        bgColor = "#E8F3FF";
      } else if (contract.progressRate > 0) {
        color = "#FF9800";
        bgColor = "#FFF3E0";
      } else {
        color = "#9E9E9E";
        bgColor = "#F5F5F5";
      }
    }

    return { color, bgColor };
  };

  // 참여자 상태 코드에 따른 색상 정보 반환 함수
  const getParticipantStatusColor = (statusCodeId) => {
    // 기본 색상
    let color = "#666";
    let bgColor = "#EEEEEE";

    // 참여자 상태 코드에 따른 색상 설정
    switch (statusCodeId) {
      case "008001_0001": // 승인 대기
        color = "#FF9800";
        bgColor = "#FFF3E0";
        break;
      case "008001_0002": // 승인 완료
        color = "#4CAF50";
        bgColor = "#E8F5E9";
        break;
      case "008001_0003": // 서명 대기
        color = "#666666";
        bgColor = "#F5F5F5";
        break;
      case "008001_0004": // 서명 중
        color = "#2196F3";
        bgColor = "#E3F2FD";
        break;
      case "008001_0005": // 승인 거부
        color = "#F44336";
        bgColor = "#FFEBEE";
        break;
      default:
        break;
    }

    return { color, bgColor };
  };

  // 참여자가 승인 대기 상태인지 확인
  const isParticipantWaitingApproval = (participant) => {
    return participant.statusCodeId === "008001_0001"; // 승인 대기 상태 확인
  };

  // 참여자가 재서명 요청 상태인지 확인
  const isParticipantRequestingResign = (participant) => {
    return participant.statusCodeId === "008001_0006"; // 재서명 요청 상태 확인
  };

  // 서명된 PDF 미리보기 핸들러
  const handlePreviewSignedPdf = async (participant) => {
    if (!participant.pdfId) {
      alert("서명된 PDF 정보를 찾을 수 없습니다.");
      return;
    }

    try {
      // 새 창에서 PDF 미리보기 열기 대신 미리보기 페이지로 이동
      navigate(
        `/contract-preview/${contract.id}/participant/${participant.id}`
      );
    } catch (error) {
      console.error("PDF 미리보기 중 오류:", error);
      alert("PDF 미리보기를 열 수 없습니다.");
    }
  };

  // 상세 정보 다이얼로그 열기 함수
  const handleOpenDetailDialog = (type, content) => {
    setDetailType(type);
    setDetailContent(content);
    setDetailDialogOpen(true);
  };

  // 상세 정보 다이얼로그 닫기 함수
  const handleCloseDetailDialog = () => {
    setDetailDialogOpen(false);
  };

  if (loading) return <Box>로딩중...</Box>;
  if (!contract) return <Box>계약 정보를 찾을 수 없습니다.</Box>;

  return (
    <>
      <Box sx={{ p: 3, backgroundColor: "#F8F8FE", minHeight: "100vh" }}>
        {/* 상단 헤더 */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: "#3A3A3A" }}>
            계약 조회
          </Typography>
        </Box>

        {/* 전체 컨테이너 */}
        <Paper
          sx={{
            p: 3,
            borderRadius: 2,
            boxShadow: "none",
            border: "1px solid #EEEEEE",
          }}
        >
          {/* 계약 정보 섹션 */}
          <Box sx={{ mb: 5 }}>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 600, color: "#3A3A3A", mb: 2 }}
            >
              계약 정보
            </Typography>
            <Paper
              sx={{
                p: 3,
                borderRadius: 1,
                boxShadow: "none",
                border: "1px solid #EEEEEE",
              }}
            >
              <Box sx={{ display: "grid", rowGap: 3 }}>
                <Box sx={{ display: "grid", gridTemplateColumns: "120px 1fr" }}>
                  <Typography sx={{ color: "#666" }}>제목</Typography>
                  <Typography>{contract.title}</Typography>
                </Box>
                <Box sx={{ display: "grid", gridTemplateColumns: "120px 1fr" }}>
                  <Typography sx={{ color: "#666" }}>작성일</Typography>
                  <Typography>
                    {new Date(contract.createdAt).toLocaleDateString("ko-KR", {
                      year: "2-digit",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    })}
                  </Typography>
                </Box>
                <Box sx={{ display: "grid", gridTemplateColumns: "120px 1fr" }}>
                  <Typography sx={{ color: "#666" }}>계약 상태</Typography>
                  <Box
                    sx={{
                      backgroundColor: getStatusColor(contract).bgColor,
                      color: getStatusColor(contract).color,
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 1,
                      width: "fit-content",
                      fontSize: "0.875rem",
                    }}
                  >
                    {contract.statusName ||
                      (contract.progressRate === 100
                        ? "계약 완료"
                        : contract.progressRate > 0
                        ? "서명 진행중"
                        : "서명 전")}
                  </Box>
                </Box>
                <Box>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Typography sx={{ color: "#666" }}>서명 진행률</Typography>
                    <Typography sx={{ color: "#1976d2" }}>
                      {contract.participants.filter((p) => p.signed).length} /{" "}
                      {contract.participants.length}명 ({contract.progressRate}
                      %)
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={contract.progressRate}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: "#E8F3FF",
                      "& .MuiLinearProgress-bar": {
                        backgroundColor: "#1976d2",
                        borderRadius: 4,
                      },
                    }}
                  />
                </Box>
              </Box>
            </Paper>
          </Box>

          {/* 계약서 정보 섹션 */}
          <Box sx={{ mb: 5 }}>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 600, color: "#3A3A3A", mb: 2 }}
            >
              계약서 정보
            </Typography>
            <Paper
              sx={{
                p: 3,
                borderRadius: 1,
                boxShadow: "none",
                border: "1px solid #EEEEEE",
              }}
            >
              <Box sx={{ display: "grid", rowGap: 3 }}>
                {/* 템플릿 목록 표시 */}
                {contract.templates && contract.templates.length > 0 && (
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "120px 1fr",
                      alignItems: "flex-start",
                    }}
                  >
                    <Typography sx={{ color: "#666" }}>계약서 목록</Typography>
                    <Box
                      sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                    >
                      {contract.templates.map((template, index) => (
                        <Box
                          key={template.id}
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <LabelIcon sx={{ color: "#1976d2", fontSize: 20 }} />

                          <Typography>
                            {index + 1}. {template.templateName}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            </Paper>
          </Box>

          {/* 서명 참여자 정보 섹션 */}
          <Box>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 600, color: "#3A3A3A", mb: 2 }}
            >
              서명 참여자 정보
            </Typography>
            <Paper
              sx={{
                p: 3,
                borderRadius: 1,
                boxShadow: "none",
                border: "1px solid #EEEEEE",
              }}
            >
              {/* 헤더 행 */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr 1.5fr 1fr 0.8fr",
                    sm: "1fr 1.5fr 1fr 0.8fr",
                    md: "1fr 1.5fr 1fr 0.8fr",
                  },
                  gap: 2,
                  pb: 2,
                  borderBottom: "1px solid #EEEEEE",
                }}
              >
                <Typography sx={{ color: "#666" }}>이름</Typography>
                <Typography sx={{ color: "#666" }}>E-mail</Typography>
                <Typography sx={{ color: "#666" }}>연락처</Typography>
                <Typography sx={{ color: "#666" }}>상태</Typography>
              </Box>

              {/* 참여자 목록 */}
              {contract.participants.map((participant, index) => (
                <React.Fragment key={index}>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "1fr 1.5fr 1fr 0.8fr",
                        sm: "1fr 1.5fr 1fr 0.8fr",
                        md: "1fr 1.5fr 1fr 0.8fr",
                      },
                      gap: 2,
                      py: 2,
                      borderBottom: "none",
                      alignItems: "center",
                    }}
                  >
                    <Typography
                      sx={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      {participant.name}
                    </Typography>
                    <Typography
                      onClick={() =>
                        handleOpenDetailDialog("이메일", participant.email)
                      }
                      sx={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        cursor: "pointer",
                        "&:hover": {
                          textDecoration: "underline",
                          color: "#3182F6",
                        },
                      }}
                    >
                      {participant.email}
                    </Typography>
                    <Typography
                      onClick={() =>
                        handleOpenDetailDialog(
                          "연락처",
                          participant.phoneNumber
                        )
                      }
                      sx={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        cursor: "pointer",
                        "&:hover": {
                          textDecoration: "underline",
                          color: "#3182F6",
                        },
                      }}
                    >
                      {participant.phoneNumber}
                    </Typography>
                    {/* 참여자 상태 표시 */}
                    <Box
                      sx={{
                        backgroundColor: getParticipantStatusColor(
                          participant.statusCodeId || ""
                        ).bgColor,
                        color: getParticipantStatusColor(
                          participant.statusCodeId || ""
                        ).color,
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 1,
                        width: "fit-content",
                        fontSize: "0.75rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {participant.statusName ||
                        (participant.signed ? "서명 완료" : "서명 대기")}
                    </Box>
                  </Box>

                  {/* 문서/관리 섹션 */}
                  <Box
                    sx={{
                      ml: 0,
                      mr: 0,
                      mb: 2,
                      mt: 2,
                      py: 1.5,
                      px: 0,
                      backgroundColor: "transparent",
                      borderRadius: 0,
                      borderTop: "1px dashed #EEEEEE",
                      borderBottom: "none",
                      border: "none",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        mb: 1.5,
                        mt: 1,
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: 600,
                          color: "#505050",
                          fontSize: "0.8rem",
                        }}
                      >
                        문서/관리
                        {participant.templatePdfs &&
                          participant.templatePdfs.length > 0 && (
                            <Typography
                              component="span"
                              sx={{
                                ml: 0.5,
                                color: "#505050",
                                fontWeight: 600,
                                fontSize: "0.8rem",
                              }}
                            >
                              ({participant.templatePdfs.length}개)
                            </Typography>
                          )}
                      </Typography>

                      {/* 통합 관리 버튼 영역 */}
                      <Box sx={{ display: "flex", gap: 1 }}>
                        {participant.statusName === "재서명 진행중" ||
                        participant.statusCodeId === "008001_0007" ? (
                          <Typography
                            sx={{ color: "#666", fontSize: "0.75rem" }}
                          >
                            진행 중
                          </Typography>
                        ) : isParticipantWaitingApproval(participant) ? (
                          <>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() =>
                                handleOpenApproveDialog(participant)
                              }
                              sx={{
                                borderColor: "#3182F6",
                                color: "#3182F6",
                                fontSize: "0.7rem",
                                height: "24px",
                                "&:hover": {
                                  borderColor: "#1565C0",
                                  backgroundColor: "rgba(49, 130, 246, 0.04)",
                                },
                              }}
                            >
                              승인
                            </Button>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() =>
                                handleOpenRejectDialog(participant)
                              }
                              sx={{
                                borderColor: "#3182F6",
                                color: "#3182F6",
                                fontSize: "0.7rem",
                                height: "24px",
                                "&:hover": {
                                  borderColor: "#1565C0",
                                  backgroundColor: "rgba(244, 67, 54, 0.04)",
                                },
                              }}
                            >
                              거부
                            </Button>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() =>
                                navigate(
                                  `/contract-correction-request/${contract.id}/participant/${participant.id}`
                                )
                              }
                              sx={{
                                borderColor: "#3182F6",
                                color: "#3182F6",
                                fontSize: "0.7rem",
                                height: "24px",
                                "&:hover": {
                                  borderColor: "#1565C0",
                                  backgroundColor: "rgba(255, 152, 0, 0.04)",
                                },
                              }}
                            >
                              재서명
                            </Button>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() =>
                                handlePreviewSignedPdf(participant)
                              }
                              sx={{
                                borderColor: "#3182F6",
                                color: "#3182F6",
                                fontSize: "0.7rem",
                                height: "24px",
                                "&:hover": {
                                  borderColor: "#1565C0",
                                  backgroundColor: "rgba(76, 175, 80, 0.04)",
                                },
                              }}
                            >
                              미리보기
                            </Button>
                          </>
                        ) : isParticipantRequestingResign(participant) ? (
                          <>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() =>
                                handleOpenResignApproveDialog(participant)
                              }
                              sx={{
                                borderColor: "#3182F6",
                                color: "#3182F6",
                                fontSize: "0.7rem",
                                height: "24px",
                                "&:hover": {
                                  borderColor: "#1565C0",
                                  backgroundColor: "rgba(49, 130, 246, 0.04)",
                                },
                              }}
                            >
                              재서명 승인
                            </Button>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() =>
                                handlePreviewSignedPdf(participant)
                              }
                              sx={{
                                borderColor: "#4CAF50",
                                color: "#4CAF50",
                                fontSize: "0.7rem",
                                height: "24px",
                                "&:hover": {
                                  borderColor: "#388E3C",
                                  backgroundColor: "rgba(76, 175, 80, 0.04)",
                                },
                              }}
                            >
                              미리보기
                            </Button>
                          </>
                        ) : (participant.statusCodeId &&
                            [
                              "008001_0001",
                              "008001_0002",
                              "008001_0005",
                            ].includes(participant.statusCodeId)) ||
                          participant.signed ? (
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={
                              <DownloadIcon sx={{ fontSize: "0.8rem" }} />
                            }
                            onClick={() =>
                              handleDownloadAllSignedPdfs(participant.id)
                            }
                            sx={{
                              borderColor: "#3182F6",
                              color: "#3182F6",
                              fontSize: "0.7rem",
                              height: "24px",
                              "&:hover": {
                                borderColor: "#1565C0",
                                backgroundColor: "rgba(49, 130, 246, 0.04)",
                              },
                            }}
                          >
                            계약문서 다운로드
                          </Button>
                        ) : (
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<DrawIcon sx={{ fontSize: "0.8rem" }} />}
                            onClick={() => handleSignatureClick(participant)}
                            sx={{
                              borderColor: "#3182F6",
                              color: "#3182F6",
                              fontSize: "0.7rem",
                              height: "24px",
                              "&:hover": {
                                borderColor: "#1565C0",
                                backgroundColor: "rgba(49, 130, 246, 0.04)",
                              },
                            }}
                          >
                            현장서명
                          </Button>
                        )}
                      </Box>
                    </Box>

                    {/* 계약 문서 목록 */}
                    {participant.templatePdfs &&
                      participant.templatePdfs.length > 0 && (
                        <Box sx={{ pl: 0.5 }}>
                          {participant.templatePdfs.map((pdf, i) => (
                            <Box
                              key={i}
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                py: 1,
                                borderBottom:
                                  i < participant.templatePdfs.length - 1
                                    ? "1px dashed #F0F0F0"
                                    : "none",
                              }}
                            >
                              <Box
                                sx={{ display: "flex", alignItems: "center" }}
                              >
                                <FilePresentIcon
                                  sx={{
                                    color: "#3182F6",
                                    mr: 1,
                                    fontSize: "1rem",
                                  }}
                                />
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: "#333",
                                    fontWeight: 500,
                                    fontSize: "0.8rem",
                                  }}
                                >
                                  {pdf.templateName}
                                </Typography>
                              </Box>
                            </Box>
                          ))}
                        </Box>
                      )}
                  </Box>

                  {/* 첨부파일 목록 섹션 */}
                  {participantDocuments[participant.id] &&
                    participantDocuments[participant.id].length > 0 && (
                      <Box
                        sx={{
                          ml: 0,
                          mr: 0,
                          mb: 2,
                          py: 1.5,
                          px: 0,
                          backgroundColor: "transparent",
                          borderRadius: 0,
                          borderTop: "1px dashed #EEEEEE",
                          borderBottom: "none",
                          border: "none",
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{
                            mb: 1.5,
                            mt: 1,
                            pl: 0,
                            fontWeight: 600,
                            color: "#505050",
                            fontSize: "0.8rem",
                          }}
                        >
                          필수 첨부파일 목록 (
                          {participantDocuments[participant.id].length}개)
                        </Typography>

                        <Box sx={{ pl: 0.5 }}>
                          {participantDocuments[participant.id].map(
                            (doc, docIndex) => (
                              <Box
                                key={doc.id}
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  py: 1,
                                  borderBottom:
                                    docIndex <
                                    participantDocuments[participant.id]
                                      .length -
                                      1
                                      ? "1px dashed #F0F0F0"
                                      : "none",
                                }}
                              >
                                <Box
                                  sx={{ display: "flex", alignItems: "center" }}
                                >
                                  <FilePresentIcon
                                    sx={{
                                      color: "#3182F6",
                                      mr: 1,
                                      fontSize: "1rem",
                                    }}
                                  />
                                  <Box>
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        color: "#333",
                                        fontWeight: 500,
                                        fontSize: "0.8rem",
                                      }}
                                    >
                                      {doc.documentCodeName}
                                    </Typography>
                                    {doc.originalFileName && (
                                      <Typography
                                        variant="caption"
                                        sx={{
                                          color: "#666",
                                          display: "block",
                                          fontSize: "0.75rem",
                                        }}
                                      >
                                        {doc.originalFileName}
                                      </Typography>
                                    )}
                                  </Box>
                                </Box>

                                <Box>
                                  {doc.fileId ? (
                                    <Box sx={{ display: "flex", gap: 1 }}>
                                      <Button
                                        variant="outlined"
                                        size="small"
                                        startIcon={
                                          <DownloadIcon
                                            sx={{ fontSize: "0.8rem" }}
                                          />
                                        }
                                        onClick={() =>
                                          handleDocumentDownload(
                                            doc.id,
                                            doc.originalFileName
                                          )
                                        }
                                        sx={{
                                          borderColor: "#3182F6",
                                          color: "#3182F6",
                                          fontSize: "0.7rem",
                                          height: "24px",
                                          "&:hover": {
                                            borderColor: "#1565C0",
                                            backgroundColor:
                                              "rgba(49, 130, 246, 0.04)",
                                          },
                                        }}
                                      >
                                        첨부파일 다운로드
                                      </Button>
                                      <Button
                                        variant="outlined"
                                        size="small"
                                        onClick={() =>
                                          handleDocumentPreview(
                                            doc.id,
                                            doc.originalFileName
                                          )
                                        }
                                        sx={{
                                          borderColor: "#3182F6",
                                          color: "#3182F6",
                                          fontSize: "0.7rem",
                                          height: "24px",
                                          "&:hover": {
                                            borderColor: "#1565C0",
                                            backgroundColor:
                                              "rgba(76, 175, 80, 0.04)",
                                          },
                                        }}
                                      >
                                        미리보기
                                      </Button>
                                    </Box>
                                  ) : (
                                    <Box
                                      sx={{
                                        display: "flex",
                                        alignItems: "center",
                                      }}
                                    >
                                      <Chip
                                        label="미제출"
                                        size="small"
                                        sx={{
                                          backgroundColor: doc.required
                                            ? "#FFF3E0"
                                            : "#EEEEEE",
                                          color: doc.required
                                            ? "#FF9800"
                                            : "#666",
                                          fontSize: "0.7rem",
                                          height: "20px",
                                          mr: 1,
                                        }}
                                      />
                                      <Button
                                        variant="outlined"
                                        size="small"
                                        aria-haspopup="true"
                                        onClick={(e) =>
                                          handleOpenUploadMenu(
                                            e,
                                            participant,
                                            doc
                                          )
                                        }
                                        startIcon={
                                          <UploadIcon fontSize="small" />
                                        }
                                        disabled={uploadLoading}
                                        sx={{
                                          borderColor: "#3182F6",
                                          color: "#3182F6",
                                          fontSize: "0.7rem",
                                          height: "24px",
                                          "&:hover": {
                                            borderColor: "#1565C0",
                                            backgroundColor:
                                              "rgba(49, 130, 246, 0.04)",
                                          },
                                        }}
                                      >
                                        {uploadLoading &&
                                        selectedDoc?.doc?.id === doc.id
                                          ? "업로드 중..."
                                          : "업로드"}
                                      </Button>
                                    </Box>
                                  )}
                                </Box>
                              </Box>
                            )
                          )}
                        </Box>
                      </Box>
                    )}

                  {/* 참여자 구분선 */}
                  <Divider
                    sx={{
                      my: index < contract.participants.length - 1 ? 1 : 0,
                    }}
                  />
                </React.Fragment>
              ))}
            </Paper>
          </Box>
        </Paper>
      </Box>

      {/* 승인 다이얼로그 */}
      <Dialog
        open={approveDialogOpen}
        onClose={handleCloseApproveDialog}
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
          참여자 서명 승인
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="body2" sx={{ mb: 2, mt: 2, color: "#505050" }}>
            {selectedParticipant?.name} 님의 서명을 승인하시겠습니까?
          </Typography>
          <TextField
            fullWidth
            label="승인 코멘트 (선택사항)"
            value={approveComment}
            onChange={(e) => setApproveComment(e.target.value)}
            multiline
            rows={3}
            margin="normal"
            variant="outlined"
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
        </DialogContent>
        <DialogActions
          sx={{
            px: 3,
            py: 2,
            borderTop: "1px solid #F0F0F0",
            justifyContent: "flex-end",
          }}
        >
          <Button
            onClick={handleCloseApproveDialog}
            sx={{
              color: "#666",
              "&:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.04)",
              },
              fontWeight: 500,
              px: 2,
            }}
            disabled={approveLoading}
          >
            취소
          </Button>
          <Button
            onClick={handleApproveParticipant}
            variant="contained"
            disabled={approveLoading}
            startIcon={
              approveLoading ? (
                <CircularProgress size={20} color="inherit" />
              ) : null
            }
            sx={{
              bgcolor: "#3182F6",
              "&:hover": {
                bgcolor: "#1565C0",
              },
              "&.Mui-disabled": {
                bgcolor: "rgba(49, 130, 246, 0.3)",
              },
              fontWeight: 500,
              boxShadow: "none",
              px: 2,
            }}
          >
            {approveLoading ? "처리중..." : "승인"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 거부 다이얼로그 */}
      <Dialog
        open={rejectDialogOpen}
        onClose={handleCloseRejectDialog}
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
          참여자 서명 거부
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography
            variant="body2"
            sx={{
              mb: 2,
              mt: 2,
              color: "#FF4D4F",
              bgcolor: "rgba(255, 77, 79, 0.08)",
              p: 2,
              borderRadius: "4px",
            }}
          >
            주의: {selectedParticipant?.name} 님의 서명을 거부하면 모든 참여자의
            서명 상태가 초기화되고 계약이 재서명 상태로 변경됩니다.
          </Typography>
          <TextField
            fullWidth
            label="거부 사유 (필수)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            error={!rejectReason.trim()}
            helperText={!rejectReason.trim() ? "거부 사유를 입력해주세요." : ""}
            multiline
            rows={3}
            margin="normal"
            variant="outlined"
            required
            sx={{
              "& .MuiOutlinedInput-root": {
                "& fieldset": {
                  borderColor: !rejectReason.trim() ? "#FF4D4F" : "#E0E0E0",
                },
                "&:hover fieldset": {
                  borderColor: !rejectReason.trim() ? "#FF4D4F" : "#BDBDBD",
                },
                "&.Mui-focused fieldset": {
                  borderColor: !rejectReason.trim() ? "#FF4D4F" : "#3182F6",
                },
              },
            }}
          />
        </DialogContent>
        <DialogActions
          sx={{
            px: 3,
            py: 2,
            borderTop: "1px solid #F0F0F0",
            justifyContent: "flex-end",
          }}
        >
          <Button
            onClick={handleCloseRejectDialog}
            sx={{
              color: "#666",
              "&:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.04)",
              },
              fontWeight: 500,
              px: 2,
            }}
            disabled={rejectLoading}
          >
            취소
          </Button>
          <Button
            onClick={handleRejectParticipant}
            variant="contained"
            disabled={rejectLoading || !rejectReason.trim()}
            startIcon={
              rejectLoading ? (
                <CircularProgress size={20} color="inherit" />
              ) : null
            }
            sx={{
              bgcolor: "#3182F6",
              "&:hover": {
                bgcolor: "#1565C0",
              },
              "&.Mui-disabled": {
                bgcolor: "rgba(49, 130, 246, 0.3)",
              },
              fontWeight: 500,
              boxShadow: "none",
              px: 2,
            }}
          >
            {rejectLoading ? "처리중..." : "거부"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 재서명 승인 다이얼로그 */}
      <Dialog
        open={resignApproveDialogOpen}
        onClose={handleCloseResignApproveDialog}
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
          참여자 재서명 요청 승인
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="body2" sx={{ mb: 3, mt: 2, color: "#505050" }}>
            <strong>{selectedParticipant?.name}</strong> 님의 재서명 요청을
            승인하시겠습니까?
          </Typography>
          {selectedParticipant?.resignRequestReason && (
            <Paper sx={{ p: 2, mb: 3, bgcolor: "#F8F8FA", borderRadius: 1 }}>
              <Typography
                variant="caption"
                sx={{ color: "#666", display: "block", mb: 1 }}
              >
                재서명 요청 사유:
              </Typography>
              <Typography variant="body2" sx={{ color: "#333" }}>
                {selectedParticipant.resignRequestReason}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "#666", display: "block", mt: 1 }}
              >
                요청 시간:{" "}
                {selectedParticipant.resignRequestedAt
                  ? new Date(
                      selectedParticipant.resignRequestedAt
                    ).toLocaleString("ko-KR")
                  : ""}
              </Typography>
            </Paper>
          )}
          <Typography
            variant="body2"
            sx={{ mb: 1, mt: 2, color: "#505050", fontWeight: 500 }}
          >
            승인자 이름
          </Typography>
          <TextField
            fullWidth
            value={approver}
            onChange={(e) => setApprover(e.target.value)}
            placeholder="승인자 이름을 입력하세요"
            variant="outlined"
            margin="normal"
            required
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
          <Typography
            variant="body2"
            sx={{
              mt: 3,
              color: "#FF4D4F",
              bgcolor: "rgba(255, 77, 79, 0.08)",
              p: 2,
              borderRadius: "4px",
            }}
          >
            주의: 재서명 요청을 승인하면 해당 참여자의 서명 상태가 초기화되고,
            참여자는 처음부터 다시 서명을 진행해야 합니다.
          </Typography>
        </DialogContent>
        <DialogActions
          sx={{
            px: 3,
            py: 2,
            borderTop: "1px solid #F0F0F0",
            justifyContent: "flex-end",
          }}
        >
          <Button
            onClick={handleCloseResignApproveDialog}
            sx={{
              color: "#666",
              "&:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.04)",
              },
              fontWeight: 500,
              px: 2,
            }}
            disabled={resignApproveLoading}
          >
            취소
          </Button>
          <Button
            onClick={handleApproveResign}
            variant="contained"
            disabled={resignApproveLoading || !approver.trim()}
            startIcon={
              resignApproveLoading ? (
                <CircularProgress size={20} color="inherit" />
              ) : null
            }
            sx={{
              bgcolor: "#3182F6",
              "&:hover": {
                bgcolor: "#1565C0",
              },
              "&.Mui-disabled": {
                bgcolor: "rgba(49, 130, 246, 0.3)",
              },
              fontWeight: 500,
              boxShadow: "none",
              px: 2,
            }}
          >
            {resignApproveLoading ? "처리중..." : "승인"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 상세 정보 다이얼로그 */}
      <Dialog
        open={detailDialogOpen}
        onClose={handleCloseDetailDialog}
        maxWidth="xs"
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
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {detailType}
          </Typography>
          <Button
            onClick={handleCloseDetailDialog}
            sx={{ minWidth: "auto", p: 0.5 }}
          >
            <CloseIcon fontSize="small" />
          </Button>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ py: 1 }}>
            <Typography
              sx={{
                wordBreak: "break-all",
                color: "#333",
              }}
            >
              {detailContent}
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>

      {/* 파일 업로드 메뉴 */}
      <Menu
        anchorEl={uploadMenuAnchor}
        open={Boolean(uploadMenuAnchor)}
        onClose={handleCloseUploadMenu}
        PaperProps={{
          sx: {
            minWidth: 180,
            boxShadow: "0px 2px 10px rgba(0, 0, 0, 0.08)",
            borderRadius: "8px",
          },
        }}
      >
        <MenuItem onClick={handleFileUpload} sx={{ py: 1 }}>
          <InsertDriveFileIcon fontSize="small" sx={{ mr: 1, color: "#666" }} />
          <Typography variant="body2">파일 찾아보기</Typography>
        </MenuItem>
        <MenuItem onClick={handleCameraUpload} sx={{ py: 1 }}>
          <PhotoCameraIcon fontSize="small" sx={{ mr: 1, color: "#666" }} />
          <Typography variant="body2">사진 촬영하기</Typography>
        </MenuItem>
      </Menu>

      {/* 카메라 다이얼로그 */}
      <Dialog
        open={cameraDialogOpen}
        onClose={handleCloseCameraDialog}
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: "12px",
            overflow: "hidden",
            maxWidth: "640px",
          },
        }}
      >
        <DialogTitle
          sx={{
            p: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #eee",
          }}
        >
          <Typography variant="h6" sx={{ fontSize: "1.1rem", fontWeight: 600 }}>
            웹캠으로 사진 촬영
          </Typography>
          <IconButton onClick={handleCloseCameraDialog} size="small" edge="end">
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, bgcolor: "#000", position: "relative" }}>
          <Box
            sx={{
              width: "100%",
              height: "100%",
              overflow: "hidden",
              position: "relative",
            }}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: "100%",
                maxHeight: "480px",
                objectFit: "contain",
                display: "block",
              }}
            />
            <canvas ref={canvasRef} style={{ display: "none" }} />
          </Box>
        </DialogContent>
        <DialogActions
          sx={{ p: 2, justifyContent: "center", borderTop: "1px solid #eee" }}
        >
          <Button
            variant="contained"
            onClick={handleCapture}
            startIcon={<PhotoCameraIcon />}
            sx={{
              px: 3,
              py: 1,
              backgroundColor: "#3182F6",
              color: "white",
              "&:hover": {
                backgroundColor: "#1565C0",
              },
            }}
          >
            촬영하기
          </Button>
        </DialogActions>
      </Dialog>

      {/* 파일 입력 (숨김) */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,.jpg,.jpeg,.png"
        style={{ display: "none" }}
      />

      {/* 알림 메시지 */}
      <Snackbar
        open={uploadSuccess}
        autoHideDuration={3000}
        onClose={handleCloseSuccessAlert}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSuccessAlert}
          severity="success"
          sx={{ width: "100%" }}
        >
          파일이 성공적으로 업로드되었습니다.
        </Alert>
      </Snackbar>

      <Snackbar
        open={Boolean(uploadError)}
        autoHideDuration={3000}
        onClose={handleCloseErrorAlert}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseErrorAlert}
          severity="error"
          sx={{ width: "100%" }}
        >
          {uploadError}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ContractDetailPage;
