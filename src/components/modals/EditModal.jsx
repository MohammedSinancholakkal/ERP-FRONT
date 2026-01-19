import React from 'react';
import BaseModal from './BaseModal';
import { Save, Trash2, ArchiveRestore } from 'lucide-react';
import { useTheme } from "../../context/ThemeContext";

const EditModal = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  onRestore,
  isInactive,
  title,
  children,
  permissionDelete = true,
  permissionEdit = true,
  zIndex,
}) => {
  const { theme } = useTheme();
  const modalRef = React.useRef(null);

  React.useEffect(() => {
    if (isOpen) {
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

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (document.activeElement.tagName === 'TEXTAREA') return;
      // Only save if it's not a read-only view / permission issue logic might be needed
      // But typically Enter -> Save is expected behavior in edit form
      if (!isInactive && permissionEdit) {
         e.preventDefault();
         onSave();
      }
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      zIndex={zIndex}
      footer={
        <div className="flex justify-between w-full">
          {isInactive ? (
            <button
              onClick={onRestore}
              className={`flex items-center gap-2 px-4 py-2 border rounded ${theme === 'emerald' ? 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700' : theme === 'purple' ? ' bg-[#6448AE] hover:bg-[#6E55B6]  text-white border-[#6448AE]' : 'bg-green-600 border-green-900 hover:bg-green-700'}`}
            >
              <ArchiveRestore size={16} /> Restore
            </button>
          ) : (
            permissionDelete && (
              <button
                onClick={onDelete}
              className={`flex items-center gap-2 px-4 py-2 border rounded ${theme === 'emerald' ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' : theme === 'purple' ? 'flex items-center gap-2 bg-red-600 border border-red-500 px-4 py-2 rounded text-white hover:bg-red-500' : 'bg-red-600 border-red-900 hover:bg-red-700'}`}
              >
                <Trash2 size={16} /> Delete
              </button>
            )
          )}

          {permissionEdit && !isInactive && (
            <button
              onClick={onSave}
              className={`flex items-center gap-2 px-4 py-2 border rounded ${theme === 'emerald' ? 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700 shadow-sm' : theme === 'purple' ? ' bg-[#6448AE] hover:bg-[#6E55B6]  text-white border-[#6448AE]' : 'bg-gray-800 border-gray-600 text-blue-300 hover:bg-gray-700'}`}
            >
              <Save size={16} /> Save
            </button>
          )}
        </div>
      }
    >
      <div ref={modalRef} onKeyDown={handleKeyDown} tabIndex={-1} className="outline-none">
        {children}
      </div>
    </BaseModal>
  );
};

export default EditModal;
