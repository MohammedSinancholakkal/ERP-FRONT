import React from 'react';
import BaseModal from './BaseModal';
import { Save } from 'lucide-react';

const AddModal = ({ isOpen, onClose, onSave, title = "New Item", children, saveText = "Save", zIndex }) => {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      zIndex={zIndex}
      footer={
        <button
          onClick={onSave}
          className="flex items-center gap-2 bg-gray-800 border border-gray-600 px-4 py-2 rounded text-sm text-blue-300 hover:bg-gray-700"
        >
          <Save size={16} /> {saveText}
        </button>
      }
    >
      {children}
    </BaseModal>
  );
};

export default AddModal;
