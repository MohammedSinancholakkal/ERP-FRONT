import React from 'react';
import BaseModal from './BaseModal';
import { Save } from 'lucide-react';
import { useTheme } from "../../context/ThemeContext";

const AddModal = ({ isOpen, onClose, onSave, title = "New Item", children, saveText = "Save", zIndex }) => {
  const { theme } = useTheme();
  const modalRef = React.useRef(null);

  React.useEffect(() => {
    if (isOpen) {
      setLoading(false); // Reset loading state
      // Small timeout to ensure DOM is ready
      const timer = setTimeout(() => {
        const firstInput = modalRef.current?.querySelector('input, textarea, select');
        if (firstInput) {
          firstInput.focus();
        } else if (modalRef.current) {
          modalRef.current.focus();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const [loading, setLoading] = React.useState(false);
  const isMounted = React.useRef(true);

  React.useEffect(() => {
    return () => { isMounted.current = false; };
  }, []);

  const handleSave = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (loading) return;

    setLoading(true);
    try {
      await onSave();
    } catch (error) {
      console.error(error);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      // Don't submit if it's a textarea to allow new lines
      if (document.activeElement.tagName === 'TEXTAREA') return;
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      zIndex={zIndex}
      footer={
        <button
          onClick={handleSave}
          disabled={loading}
          className={`flex items-center gap-2 border px-4 py-2 rounded text-sm ${theme === 'emerald' ? 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700 shadow-sm' : theme === 'purple' ? ' bg-[#6448AE] hover:bg-[#6E55B6]  text-white border-[#6448AE]' : 'bg-gray-800 border-gray-600 text-blue-300 hover:bg-gray-700'} ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {loading ? (
             <>
               <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
               Saving...
             </>
          ) : (
             <>
               <Save size={16} /> {saveText}
             </>
          )}
        </button>
      }
    >
      <div ref={modalRef} onKeyDown={handleKeyDown} tabIndex={-1} className="outline-none">
        {children}
      </div>
    </BaseModal>
  );
};

export default AddModal;
