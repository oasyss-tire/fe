import React from 'react';
import { 
  Box, 
  Typography, 
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ko } from 'date-fns/locale';
import { format } from 'date-fns';

/**
 * 날짜 범위 선택 캘린더 컴포넌트
 * @param {Object} props
 * @param {Date} props.startDate - 시작일
 * @param {Date} props.endDate - 종료일
 * @param {Function} props.onDateChange - 날짜 변경 시 호출될 함수 (startDate, endDate) => void
 * @param {boolean} props.open - 다이얼로그 열림 상태
 * @param {Function} props.onClose - 다이얼로그 닫기 함수
 * @param {Function} props.onApply - 날짜 범위 적용 함수
 * @param {Function} props.onReset - 날짜 범위 초기화 함수
 */
const DateRangeCalendar = ({ 
  startDate, 
  endDate, 
  onDateChange, 
  open, 
  onClose, 
  onApply, 
  onReset 
}) => {
  // 임시 날짜 상태 (다이얼로그 내에서만 사용)
  const [tempStartDate, setTempStartDate] = React.useState(startDate);
  const [tempEndDate, setTempEndDate] = React.useState(endDate);

  // 다이얼로그가 열릴 때 현재 선택된 날짜로 초기화
  React.useEffect(() => {
    if (open) {
      setTempStartDate(startDate);
      setTempEndDate(endDate);
    }
  }, [open, startDate, endDate]);

  // 날짜 변경 핸들러
  const handleDateChange = (update) => {
    const [start, end] = update;
    setTempStartDate(start);
    setTempEndDate(end);
  };

  // 적용 버튼 핸들러
  const handleApply = () => {
    onDateChange(tempStartDate, tempEndDate);
    if (onApply) onApply();
  };

  // 초기화 버튼 핸들러
  const handleReset = () => {
    setTempStartDate(null);
    setTempEndDate(null);
    if (onReset) onReset();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      PaperProps={{
        sx: { 
          p: 2,
          borderRadius: 2,
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
        }
      }}
    >
      <DialogTitle sx={{ 
        p: 1, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid #f0f0f0',
        mb: 1
      }}>
        <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 500 }}>기간 검색</Typography>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 2 }}>
        <Box sx={{ my: 1 }}>
          <DatePicker
            selectsRange={true}
            startDate={tempStartDate}
            endDate={tempEndDate}
            onChange={handleDateChange}
            locale={ko}
            inline
            monthsShown={2}
            calendarClassName="custom-calendar"
            formatWeekDay={(nameOfDay) => nameOfDay.substring(0, 1)}
            renderDayContents={(day, date) => {
              // 일요일인 경우 (0: 일요일)
              const isFirstDayOfWeek = date && date.getDay() === 0;
              return (
                <span style={isFirstDayOfWeek ? { color: '#f44336' } : undefined}>
                  {day}
                </span>
              );
            }}
            dateFormat="M월 yyyy"
          />
          
          <CalendarStyles />

          {/* 선택된 날짜 표시 */}
          <Box sx={{ 
            mt: 2, 
            p: 2, 
            bgcolor: 'rgba(25, 118, 210, 0.05)', 
            borderRadius: 1,
            display: 'flex',
            justifyContent: 'space-between',
            border: '1px solid rgba(25, 118, 210, 0.1)'
          }}>
            <Box>
              <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.875rem', mb: 0.5 }}>시작일</Typography>
              <Typography sx={{ fontWeight: 600, fontSize: '1rem' }}>
                {tempStartDate ? format(tempStartDate, 'yyyy년 MM월 dd일') : '-'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.875rem', mb: 0.5 }}>종료일</Typography>
              <Typography sx={{ fontWeight: 600, fontSize: '1rem' }}>
                {tempEndDate ? format(tempEndDate, 'yyyy년 MM월 dd일') : '-'}
              </Typography>
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, pt: 1, borderTop: '1px solid #f0f0f0' }}>
        <Button 
          variant="outlined" 
          size="small" 
          onClick={handleReset}
          sx={{ 
            minWidth: '100px',
            color: 'text.secondary',
            borderColor: 'rgba(0, 0, 0, 0.23)'
          }}
        >
          초기화
        </Button>
        <Button 
          variant="contained" 
          size="small" 
          onClick={handleApply}
          disabled={!tempStartDate || !tempEndDate}
          sx={{ 
            minWidth: '100px',
            boxShadow: 'none',
            bgcolor: '#3182F6',
            '&:hover': {
              boxShadow: 'none',
              bgcolor: '#3182F6',
            },
          }}
        >
          적용
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/**
 * 캘린더 스타일 컴포넌트
 */
const CalendarStyles = () => (
  <style>{`
    .custom-calendar {
      width: 100%;
      font-family: 'Roboto', 'Noto Sans KR', sans-serif;
      border: none;
      box-shadow: none;
    }
    .react-datepicker {
      border: none;
      box-shadow: none;
      font-family: inherit;
      display: flex;
    }
    .react-datepicker__month-container {
      float: none;
      width: 50%;
      box-shadow: none;
      border: none;
    }
    /* 월 헤더 스타일 */
    .react-datepicker__header {
      background-color: white;
      border-bottom: none;
      padding-top: 12px;
      padding-bottom: 8px;
    }
    /* 월 이름 스타일 */
    .react-datepicker__current-month {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 15px;
      color: #333;
      text-align: center;
    }
    /* 요일 이름 컨테이너 */
    .react-datepicker__day-names {
      display: flex;
      justify-content: space-around;
      margin-top: 5px;
      margin-bottom: 8px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e0e0e0;
    }
    /* 요일명 스타일 */
    .react-datepicker__day-name {
      color: #757575;
      font-size: 12px;
      width: 36px;
      margin: 2px;
    }
    /* 일요일 색상 */
    .react-datepicker__day-name:first-child {
      color: #f44336;
    }
    /* 날짜 스타일 */
    .react-datepicker__day {
      width: 36px;
      height: 36px;
      line-height: 36px;
      margin: 2px;
      border-radius: 0;
      color: #333;
    }
    /* 주 컨테이너 - 높이 통일 */
    .react-datepicker__week {
      height: 40px;
      display: flex;
    }
    /* 날짜 호버 스타일 */
    .react-datepicker__day:hover {
      background-color: #f5f5f5;
      border-radius: 0;
    }
    /* 키보드 선택 시 스타일 */
    .react-datepicker__day--keyboard-selected {
      background-color: transparent;
      color: inherit;
    }
    /* 범위 내 날짜 스타일 */
    .react-datepicker__day--in-range {
      background-color: rgba(25, 118, 210, 0.2);
      color: #333;
      border-radius: 0;
      font-weight: normal;
    }
    /* 범위 시작 날짜 스타일 */
    .react-datepicker__day--range-start {
      background-color: #3182F6 !important;
      color: white !important;
      border-top-left-radius: 50%;
      border-bottom-left-radius: 50%;
      border-top-right-radius: 0;
      border-bottom-right-radius: 0;
      position: relative;
      z-index: 1;
    }
    /* 범위 종료 날짜 스타일 */
    .react-datepicker__day--range-end {
      background-color: #3182F6 !important;
      color: white !important;
      border-top-right-radius: 50%;
      border-bottom-right-radius: 50%;
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
      position: relative;
      z-index: 1;
    }
    /* 범위 시작과 끝이 같은 경우 */
    .react-datepicker__day--range-start.react-datepicker__day--range-end {
      border-radius: 50%;
    }
    /* 단일 선택 날짜 스타일 */
    .react-datepicker__day--selected {
      background-color: #1976d2;
      color: white;
      border-radius: 50%;
    }
    /* 오늘 날짜 표시 */
    .react-datepicker__day--today {
      font-weight: 600;
      color: #1976d2;
    }
    /* 현재 월이 아닌 날짜 표시 */
    .react-datepicker__day--outside-month {
      color: #bbb;
    }
    /* 현재 월이 아닌 범위 내 날짜 표시 */
    .react-datepicker__day--in-range.react-datepicker__day--outside-month {
      background-color: rgba(25, 118, 210, 0.1);
      color: #bbb;
    }
    /* 비활성화된 날짜 표시 */
    .react-datepicker__day--disabled {
      color: #ccc;
    }
    /* 첫 번째 월과 두 번째 월 구분선 */
    .react-datepicker__month-container + .react-datepicker__month-container {
      border-left: 1px solid #f0f0f0;
    }
    /* 내비게이션 버튼 스타일 */
    .react-datepicker__navigation {
      top: 15px;
    }
    .react-datepicker__navigation-icon::before {
      border-color: #1976d2;
      border-width: 2px 2px 0 0;
    }
    .react-datepicker__navigation:hover *::before {
      border-color: #1976d2;
    }
    /* 선택 중인 날짜 범위 스타일 */
    .react-datepicker__day--in-selecting-range:not(.react-datepicker__day--range-start):not(.react-datepicker__day--range-end) {
      background-color: rgba(25, 118, 210, 0.2);
      color: #333;
    }
  `}</style>
);

/**
 * 날짜 범위 선택 버튼 컴포넌트
 * @param {Object} props
 * @param {Date} props.startDate - 시작일
 * @param {Date} props.endDate - 종료일
 * @param {boolean} props.isActive - 필터 활성화 여부
 * @param {Function} props.onClick - 버튼 클릭 시 호출될 함수
 * @param {Function} props.getDateRangeText - 날짜 범위 텍스트를 반환하는 함수
 * @param {Object} props.buttonProps - 버튼에 추가할 props
 */
export const DateRangeButton = ({ 
  startDate, 
  endDate, 
  isActive, 
  onClick, 
  getDateRangeText,
  buttonProps = {}
}) => {
  // 날짜 범위 텍스트 구성
  const getRangeText = () => {
    if (!isActive) return '전체';
    
    if (!startDate || !endDate) return '전체';
    
    try {
      const startFormatted = format(new Date(startDate), 'yy-MM-dd');
      const endFormatted = format(new Date(endDate), 'yy-MM-dd');
      return `${startFormatted} ~ ${endFormatted}`;
    } catch (error) {
      console.error('날짜 형식 오류:', error);
      return '전체';
    }
  };

  return (
    <Button
      variant="outlined"
      size="small"
      onClick={onClick}
      sx={{
        minWidth: '120px',
        height: '40px',
        justifyContent: 'space-between',
        bgcolor: isActive ? 'rgba(25, 118, 210, 0.08)' : 'white',
        borderColor: isActive ? '#1976d2' : 'rgba(0, 0, 0, 0.23)',
        color: isActive ? '#1976d2' : 'rgba(0, 0, 0, 0.87)',
        '&:hover': {
          bgcolor: isActive ? 'rgba(25, 118, 210, 0.12)' : 'rgba(0, 0, 0, 0.04)'
        },
        '& .MuiButton-endIcon': {
          marginLeft: 'auto',
          marginRight: 0
        },
        '& .MuiButton-startIcon': {
          marginRight: 1
        },
        padding: '7px 10px',
        ...buttonProps.sx
      }}
      {...buttonProps}
    >
      {getDateRangeText ? getDateRangeText() : getRangeText()}
    </Button>
  );
};

export default DateRangeCalendar;