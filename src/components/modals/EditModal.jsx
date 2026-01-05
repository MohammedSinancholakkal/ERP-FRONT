import React from 'react';
import BaseModal from './BaseModal';
import { Save, Trash2, ArchiveRestore } from 'lucide-react';

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
              className="flex items-center gap-2 bg-green-600 px-4 py-2 border border-green-900 rounded hover:bg-green-700"
            >
              <ArchiveRestore size={16} /> Restore
            </button>
          ) : (
            permissionDelete && (
              <button
                onClick={onDelete}
                className="flex items-center gap-2 bg-red-600 px-4 py-2 border border-red-900 rounded hover:bg-red-700"
              >
                <Trash2 size={16} /> Delete
              </button>
            )
          )}

          {permissionEdit && !isInactive && (
            <button
              onClick={onSave}
              className="flex items-center gap-2 bg-gray-800 px-4 py-2 border border-gray-600 rounded text-blue-300 hover:bg-gray-700"
            >
              <Save size={16} /> Save
            </button>
          )}
        </div>
      }
    >
      {children}
    </BaseModal>
  );
};

export default EditModal;
