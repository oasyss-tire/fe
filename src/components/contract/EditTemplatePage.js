import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import { PdfProvider } from '../../contexts/PdfContext';
import PdfViewerPage from './PdfViewerPage';
import SaveTemplateModal from '../common/modals/SaveTemplateModal';



const EditTemplatePage = () => {
  const { templateId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [template, setTemplate] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [savedFields, setSavedFields] = useState([]);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [fileName, setFileName] = useState('');
  const [saveTemplateModalOpen, setSaveTemplateModalOpen] = useState(false);
  const [updatedFields, setUpdatedFields] = useState(null);
  
  // 템플릿 정보 가져오기
  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        setLoading(true);

        
        // 템플릿 정보 가져오기
        const response = await fetch(`http://localhost:8080/api/contract-pdf/templates/${templateId}`);
        if (!response.ok) throw new Error('템플릿 정보를 불러오는데 실패했습니다.');
        
        const data = await response.json();

        setTemplate(data);
        
        // 템플릿 필드 정보 로드
        if (data.fields && data.fields.length > 0) {
  
          
          // 상대 좌표 그대로 유지하며, 필요한 속성만 추가
          const formattedFields = data.fields.map(field => ({
            ...field,
            // 현재 필드가 편집 모드임을 표시 (confirmText 필드의 경우 사용)
            isEditMode: true,
            // type 이 없는 경우 fieldName 기준으로 추론
            type: field.type || (
              field.fieldName.startsWith('text') ? 'text' :
              field.fieldName.startsWith('signature') ? 'signature' :
              field.fieldName.startsWith('checkbox') ? 'checkbox' :
              field.fieldName.startsWith('confirmText') ? 'confirmText' : 'text'
            ),
            // id가 없는 경우 fieldName을 id로 사용
            id: field.id || field.fieldName
          }));

          setSavedFields(formattedFields);
        }
        

        
        // 올바른 PDF ID 결정
        const pdfIdForLoad = data.originalPdfId || data.pdfId;

        
        const pdfResponse = await fetch(`http://localhost:8080/api/contract-pdf/view/${pdfIdForLoad}`);
        if (!pdfResponse.ok) {
          console.error('PDF 로드 실패 - 상태:', pdfResponse.status, pdfResponse.statusText);
          throw new Error(`PDF 파일을 불러오는데 실패했습니다. (${pdfResponse.status})`);
        }

        const blob = await pdfResponse.blob();
 
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
        setFileName(data.fileName);
        
        // pdfFile로도 설정 (react-pdf 호환성)
        setPdfFile(new File([blob], data.fileName || 'document.pdf', { type: 'application/pdf' }));
        
      } catch (error) {
        console.error('템플릿 정보 로드 중 오류:', error);
        setError('템플릿 정보를 불러오는데 실패했습니다. ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplate();
  }, [templateId]);
  
  // 필드 저장 핸들러
  const handleSaveFields = async (fields) => {
    try {
      setLoading(true);

      // 기존 템플릿 필드와 매핑
      const existingFieldsMap = {};
      if (template && template.fields) {
        template.fields.forEach(field => {
          // fieldId를 키로 사용하여 기존 필드 매핑
          if (field.fieldId) {
            existingFieldsMap[field.fieldId] = field;
          }
          // id를 키로도 사용 (중복 방지)
          if (field.id) {
            existingFieldsMap[field.id] = field;
          }
        });
      }

      
      // API 요청을 위한 필드 데이터 준비
      const apiFields = fields.map(field => {
        // ID 추출 로직 개선
        let idPart = '';
        if (field.id && field.id.includes('-')) {
          idPart = field.id.split('-')[1] || '';
        } else if (field.id) {
          // '-'가 없는 경우 ID 전체 사용
          idPart = field.id;
        }
        
        // 기존 필드인지 확인 (id나 fieldId로 매칭)
        const existingField = existingFieldsMap[field.id] || 
                             existingFieldsMap[field.fieldId] || 
                             null;
        
        // field.fieldId가 있으면 사용, 없으면 field.id 사용
        // 기존 필드가 있으면 해당 fieldId 유지
        const fieldId = existingField?.fieldId || field.fieldId || field.id;
        
        // 기존 fieldName이 있고 undefined가 포함되지 않으면 사용
        // 그렇지 않으면 안전하게 생성
        let fieldName = existingField?.fieldName || field.fieldName || '';
        if (!fieldName || fieldName.includes('undefined')) {
          fieldName = `${field.type}${idPart}`;
        }
        
        // 기존 필드 ID가 있으면 해당 ID 사용
        const finalId = existingField?.id || field.id;
        
        const apiField = {
          id: finalId,
          fieldId: fieldId,
          fieldName: fieldName,
          type: field.type,
          relativeX: field.relativeX,
          relativeY: field.relativeY,
          relativeWidth: field.relativeWidth,
          relativeHeight: field.relativeHeight,
          page: field.page || 1,
          value: field.value || '',
          ...(field.confirmText ? { confirmText: field.confirmText } : {}),
          ...(field.description ? { description: field.description } : {}),
          ...(field.formatCodeId ? { formatCodeId: field.formatCodeId } : {})
        };
        
        
        return apiField;
      });

      
      // 1. 템플릿 필드 업데이트 API 호출
      const fieldsResponse = await fetch(`http://localhost:8080/api/contract-pdf/update-template-fields/${templateId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pdfId: template.pdfId,
          fields: apiFields
        })
      });
      
      if (!fieldsResponse.ok) {
        console.error('필드 수정 API 오류:', fieldsResponse.status);
        throw new Error('템플릿 필드 수정에 실패했습니다.');
      }

      
      // 필드 저장이 성공하면 수정된 필드 정보를 저장하고 템플릿 정보 편집 모달 표시
      setUpdatedFields(apiFields);
      setSaveTemplateModalOpen(true);
      
    } catch (error) {
      console.error('템플릿 저장 실패:', error);
      alert(error.message || '템플릿 수정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 템플릿 기본 정보 업데이트 핸들러
  const handleUpdateTemplateInfo = async (templateInfo) => {
    try {
      setLoading(true);

      const response = await fetch(`http://localhost:8080/api/contract-pdf/update-template-info/${templateId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          templateName: templateInfo.templateName,
          description: templateInfo.description || ""
        })
      });
      
      if (!response.ok) {
        console.error('기본 정보 수정 API 오류:', response.status);
        throw new Error('템플릿 정보 수정에 실패했습니다.');
      }

      alert('템플릿이 성공적으로 수정되었습니다.');
      
      // 템플릿 목록 페이지로 이동
      navigate('/contract-templates');
      
    } catch (error) {
      console.error('템플릿 정보 저장 실패:', error);
      alert(error.message || '템플릿 정보 수정에 실패했습니다.');
    } finally {
      setLoading(false);
      setSaveTemplateModalOpen(false);
    }
  };

  if (loading && !template) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }


  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* PDF 뷰어 */}
      <Box sx={{ flex: 1, position: 'relative' }}>
        {(pdfFile || pdfUrl) && template ? (
          <PdfProvider
            pdfFile={pdfFile}
            pdfUrl={pdfUrl}
            fileName={fileName || template.templateName || 'Document'}
            pdfId={template.pdfId}
            savedFields={savedFields}
            saveFields={handleSaveFields}
          >
            <PdfViewerPage isEditMode={true} />
          </PdfProvider>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            {loading ? (
              <CircularProgress />
            ) : (
              <Typography>
                {!pdfUrl ? 'PDF 파일을 로드하지 못했습니다.' : '템플릿 정보가 없습니다.'}
              </Typography>
            )}
          </Box>
        )}
      </Box>
      
      {/* 템플릿 정보 수정 모달 */}
      <SaveTemplateModal 
        open={saveTemplateModalOpen}
        onClose={() => setSaveTemplateModalOpen(false)}
        onSave={handleUpdateTemplateInfo}
        initialTemplateName={template?.templateName || ''}
        initialDescription={template?.description || ''}
        isEditing={true}
      />
    </Box>
  );
};

export default EditTemplatePage; 