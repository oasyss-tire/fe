import React from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Grid,
  TextField,
  FormHelperText,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Card,
  CardContent,
  Chip,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon,
  Search as SearchIcon,
  AddPhotoAlternate as AddPhotoAlternateIcon,
} from '@mui/icons-material';

// 기타 트랜잭션 사유 목록
const REASON_OPTIONS = [
  { value: '재고 확인 결과 불일치', label: '재고 확인 결과 불일치' },
  { value: '시설물 상태 점검', label: '시설물 상태 점검' },
  { value: '오류 데이터 수정', label: '오류 데이터 수정' },
  { value: '위치 확인', label: '위치 확인' },
  { value: '기타', label: '기타' }
];

const MiscForm = ({
  formData,
  selectedFacilities,
  isUserRole,
  handleChange,
  handleOpenCompanyDialog,
  handleAddFacility,
  handleRemoveFacility,
  handleImageUpload,
  handleRemoveImage,
  MAX_IMAGE_COUNT
}) => {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>
          수탁 업체 *
        </Typography>
        <TextField
          fullWidth
          size="small"
          placeholder={isUserRole ? "자동 선택됨" : "수탁 업체 선택"}
          value={formData.companyName || ''}
          onClick={() => handleOpenCompanyDialog('company')}
          InputProps={{
            readOnly: true,
            startAdornment: (
              <SearchIcon sx={{ color: '#999', mr: 1 }} />
            ),
          }}
          sx={{
            backgroundColor: isUserRole ? '#f0f0f0' : '#F8F9FA',
            cursor: isUserRole ? 'default' : 'pointer',
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: '#E0E0E0',
              },
            },
          }}
        />
        {isUserRole && (
          <FormHelperText>현재 로그인한 사용자의 업체가 자동으로 선택됩니다.</FormHelperText>
        )}
      </Grid>

      <Grid item xs={12}>
        <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>
          등록 사유 *
        </Typography>
        <FormControl 
          fullWidth 
          size="small"
          sx={{ 
            backgroundColor: '#F8F9FA',
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: '#E0E0E0',
              },
            },
          }}
        >
          <Select
            value={formData.reason || ''}
            name="reason"
            onChange={handleChange}
            displayEmpty
            renderValue={(selected) => {
              if (!selected) {
                return <Typography variant="body2" sx={{ color: '#999' }}>사유 선택</Typography>;
              }
              return selected;
            }}
          >
            <MenuItem value="">
              <em>선택하세요</em>
            </MenuItem>
            {REASON_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="caption" sx={{ color: '#666' }}>
            대상 시설물 목록 *
          </Typography>
          <Button
            size="small"
            startIcon={<AddIcon />}
            disabled={!formData.companyId}
            onClick={handleAddFacility}
            sx={{ fontSize: '0.75rem' }}
          >
            시설물 추가
          </Button>
        </Box>
        
        <Card variant="outlined" sx={{ minHeight: '120px', backgroundColor: '#F8F9FA' }}>
          <CardContent sx={{ py: 1 }}>
            {selectedFacilities.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80px', color: 'text.secondary' }}>
                <Typography variant="body2">
                  {formData.companyId 
                    ? '시설물 추가 버튼을 클릭하여 트랜잭션을 처리할 시설물을 선택해주세요.' 
                    : '수탁 업체를 먼저 선택해주세요.'}
                </Typography>
              </Box>
            ) : (
              <List dense disablePadding>
                {selectedFacilities.map((facility, index) => (
                  <React.Fragment key={facility.facilityId}>
                    <ListItem disablePadding sx={{ py: 0.5 }}>
                      <ListItemText 
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="body2" component="span" sx={{ mr: 1 }}>
                              {facility.facilityTypeName}
                            </Typography>
                            <Chip 
                              label={facility.managementNumber} 
                              size="small" 
                              sx={{ 
                                height: '20px', 
                                backgroundColor: '#FFF3E0', 
                                fontSize: '0.7rem'
                              }} 
                            />
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              상태: {facility.statusName || '-'}
                            </Typography>
                            
                            {/* 이미지 업로드 컴포넌트 */}
                            <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                              <input
                                accept="image/*"
                                style={{ display: 'none' }}
                                id={`upload-image-misc-${facility.facilityId}`}
                                multiple
                                type="file"
                                onChange={(e) => handleImageUpload(e, facility.facilityId)}
                                disabled={facility.images.length >= MAX_IMAGE_COUNT}
                              />
                              <label htmlFor={`upload-image-misc-${facility.facilityId}`}>
                                <Button
                                  variant="outlined"
                                  component="span"
                                  size="small"
                                  startIcon={<AddPhotoAlternateIcon />}
                                  disabled={facility.images.length >= MAX_IMAGE_COUNT}
                                  sx={{ 
                                    height: '24px',
                                    fontSize: '0.7rem',
                                    borderColor: '#ccc',
                                    color: '#666',
                                    p: '4px 8px',
                                    minWidth: 'auto',
                                    mr: 1,
                                    '&:hover': {
                                      borderColor: '#999',
                                      backgroundColor: 'rgba(0,0,0,0.04)'
                                    }
                                  }}
                                >
                                  이미지 추가
                                </Button>
                              </label>
                              
                              <Typography variant="caption" color="text.secondary">
                                {facility.images.length > 0 
                                  ? `${facility.images.length}개 이미지 첨부됨` 
                                  : '이미지 없음'}
                              </Typography>
                            </Box>
                            
                            {/* 이미지 미리보기 */}
                            {facility.previewUrls.length > 0 && (
                              <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {facility.previewUrls.map((url, imageIndex) => (
                                  <Box 
                                    key={imageIndex} 
                                    sx={{ 
                                      position: 'relative',
                                      width: 40, 
                                      height: 40, 
                                      overflow: 'hidden',
                                      borderRadius: 1,
                                      border: '1px solid #ddd'
                                    }}
                                  >
                                    <Box
                                      component="img"
                                      src={url}
                                      sx={{ 
                                        width: '100%', 
                                        height: '100%', 
                                        objectFit: 'cover' 
                                      }}
                                    />
                                    <IconButton
                                      size="small"
                                      onClick={() => handleRemoveImage(facility.facilityId, imageIndex)}
                                      sx={{
                                        position: 'absolute',
                                        top: -8,
                                        right: -8,
                                        width: 18,
                                        height: 18,
                                        p: 0,
                                        backgroundColor: 'rgba(0,0,0,0.5)',
                                        color: 'white',
                                        '&:hover': {
                                          backgroundColor: 'rgba(0,0,0,0.7)',
                                        }
                                      }}
                                    >
                                      <DeleteIcon sx={{ fontSize: 12 }} />
                                    </IconButton>
                                  </Box>
                                ))}
                              </Box>
                            )}
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton 
                          edge="end" 
                          size="small" 
                          onClick={() => handleRemoveFacility(facility.facilityId)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < selectedFacilities.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12}>
        <Typography variant="caption" sx={{ mb: 1, color: '#666', display: 'block' }}>
          상세 내용
        </Typography>
        <TextField
          fullWidth
          size="small"
          name="notes"
          placeholder="추가 정보 또는 참고사항을 입력하세요"
          value={formData.notes || ''}
          onChange={handleChange}
          multiline
          rows={2}
          sx={{ 
            backgroundColor: '#F8F9FA',
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: '#E0E0E0',
              },
            },
          }}
        />
      </Grid>
    </Grid>
  );
};

export default MiscForm; 