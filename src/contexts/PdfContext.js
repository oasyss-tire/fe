import React, { createContext, useState, useContext } from 'react';

export const PdfContext = createContext();

export const PdfProvider = ({ children }) => {
  const [pdfFile, setPdfFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [pdfId, setPdfId] = useState(null);
  const [savedFields, setSavedFields] = useState([]);
  const [contractId, setContractId] = useState(null);

  const saveFields = async (fields) => {
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
          confirmText: field.confirmText
        }))
      };

      console.log('Saving fields request:', requestData);

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