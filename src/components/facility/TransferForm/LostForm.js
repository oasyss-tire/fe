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
} from '@mui/material';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon,
  Search as SearchIcon,
  AddPhotoAlternate as AddPhotoAlternateIcon,
} from '@mui/icons-material';

const LostForm = ({
  formData,
  selectedFacilities,
  companies,
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="caption" sx={{ color: '#666' }}>
            분실된 시설물 목록 *
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
                    ? '시설물 추가 버튼을 클릭하여 분실된 시설물을 선택해주세요.' 
                    : '분실 업체를 먼저 선택해주세요.'}
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
                                id={`upload-image-lost-${facility.facilityId}`}
                                multiple
                                type="file"
                                onChange={(e) => handleImageUpload(e, facility.facilityId)}
                                disabled={facility.images.length >= MAX_IMAGE_COUNT}
                              />
                              <label htmlFor={`upload-image-lost-${facility.facilityId}`}>
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
          분실 상세 내용
        </Typography>
        <TextField
          fullWidth
          size="small"
          name="notes"
          placeholder="분실 상황 또는 기타 참고사항"
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

export default LostForm; 