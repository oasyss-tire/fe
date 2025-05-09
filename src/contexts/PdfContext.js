import React, { createContext, useState, useContext, useEffect } from 'react';

export const PdfContext = createContext();

export const PdfProvider = ({ 
  children, 
  pdfFile: initialPdfFile = null,
  pdfUrl: initialPdfUrl = null, 
  fileName: initialFileName = '', 
  pdfId: initialPdfId = null, 
  savedFields: initialSavedFields = [],
  saveFields: customSaveFields = null,
  contractId: initialContractId = null
}) => {
  const [pdfFile, setPdfFile] = useState(initialPdfFile);
  const [pdfUrl, setPdfUrl] = useState(initialPdfUrl);
  const [fileName, setFileName] = useState(initialFileName);
  const [pdfId, setPdfId] = useState(initialPdfId);
  const [savedFields, setSavedFields] = useState(initialSavedFields);
  const [contractId, setContractId] = useState(initialContractId);

  // props가 변경될 때 상태 업데이트
  useEffect(() => {

    
    if (initialPdfFile) setPdfFile(initialPdfFile);
    if (initialPdfUrl) setPdfUrl(initialPdfUrl);
    if (initialFileName) setFileName(initialFileName);
    if (initialPdfId) setPdfId(initialPdfId);
    if (initialSavedFields.length > 0) setSavedFields(initialSavedFields);
    if (initialContractId) setContractId(initialContractId);
  }, [initialPdfFile, initialPdfUrl, initialFileName, initialPdfId, initialSavedFields, initialContractId]);

  const saveFields = async (fields) => {
    // 사용자 정의 saveFields 함수가 있으면 먼저 실행
    if (customSaveFields) {
      try {
        await customSaveFields(fields);
      } catch (error) {
        console.error('사용자 정의 필드 저장 중 오류:', error);
        throw error;
      }
      // 사용자 정의 함수가 있는 경우 내장 함수 실행 안 함
      return;
    }
    
    try {
      
      const requestData = {
        pdfId: pdfId,
        fields: fields.map(field => ({
          id: field.id,
          type: field.type,
          fieldName: `${field.type}${field.id.split('-')[1]}`,
          relativeX: field.relativeX,
          relativeY: field.relativeY,
          relativeWidth: field.relativeWidth,
          relativeHeight: field.relativeHeight,
          page: field.page,
          value: field.value,
          confirmText: field.confirmText,
          description: field.description,
          formatCodeId: field.formatCodeId
        }))
      };

      const response = await fetch('http://localhost:8080/api/contract-pdf/fields', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', errorText);
        throw new Error('필드 저장에 실패했습니다.');
      }

      setSavedFields(fields);
    } catch (error) {
      console.error('필드 저장 중 오류 발생:', error);
      throw error;
    }
  };

  const loadSavedFields = async (pdfId) => {
    try {
      const response = await fetch(`http://localhost:8080/api/contract-pdf/fields/${pdfId}`);
      if (!response.ok) {
        throw new Error('필드 로드에 실패했습니다.');
      }
      const fields = await response.json();
      setSavedFields(fields);
    } catch (error) {
      console.error('필드 로드 중 오류 발생:', error);
    }
  };

  const uploadPdf = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8080/api/contract-pdf/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('PDF 업로드 실패');
      }

      const pdfId = await response.text();
      return pdfId;
    } catch (error) {
      console.error('PDF 업로드 중 오류:', error);
      throw error;
    }
  };

  return (
    <PdfContext.Provider value={{ 
      pdfFile, 
      setPdfFile,
      pdfUrl,
      setPdfUrl,
      fileName, 
      setFileName,
      pdfId,
      setPdfId,
      savedFields,
      saveFields,
      loadSavedFields,
      contractId,
      setContractId
    }}>
      {children}
    </PdfContext.Provider>
  );
};

export const usePdf = () => useContext(PdfContext); 