import { useEffect } from 'react';

/**
 * Custom hook to update the document title dynamically
 * @param {string} title - The title to set for the document
 * @param {boolean} keepOnUnmount - Whether to keep the title when component unmounts
 */
const useDocumentTitle = (title, keepOnUnmount = true) => {
  useEffect(() => {
    const originalTitle = document.title;
    
    if (title) {
      document.title = title;
    }
    
    return () => {
      if (!keepOnUnmount) {
        document.title = originalTitle;
      }
    };
  }, [title, keepOnUnmount]);
};

export default useDocumentTitle;

