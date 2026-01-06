import React from "react";
import { FileSpreadsheet, FileText } from "lucide-react";

const ExportButtons = ({ onExcel, onPDF }) => {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onExcel}
        className="p-1.5 bg-green-700/10 border border-green-700 rounded hover:bg-green-700/20"
        title="Export to Excel"
      >
        <FileSpreadsheet size={18} className="text-green-300" />
      </button>

      <button
        onClick={onPDF}
        className="p-1.5 bg-red-700/10 border border-red-700 rounded hover:bg-red-700/20"
        title="Export to PDF"
      >
        <FileText size={18} className="text-red-300" />
      </button>
    </div>
  );
};

export default ExportButtons;
