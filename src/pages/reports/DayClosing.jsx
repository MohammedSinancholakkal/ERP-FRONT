import React, { useState, useEffect } from "react";
import { ArrowLeft, Save, Calendar, DollarSign, Calculator } from "lucide-react";
import { hasPermission } from "../../utils/permissionUtils";
import { PERMISSIONS } from "../../constants/permissions";

import PageLayout from "../../layout/PageLayout";
import ContentCard from "../../components/ContentCard";
import InputField from "../../components/InputField";
import { useTheme } from "../../context/ThemeContext";

const DayClosing = () => {
  const { theme } = useTheme();
  if (!hasPermission(PERMISSIONS.REPORTS.VIEW)) {
    return (
      <div className="flex items-center justify-center h-full text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-400">You do not have permission to view this report.</p>
        </div>
      </div>
    );
  }
  const [lastDayClosing, setLastDayClosing] = useState(0);
  const [receive, setReceive] = useState(0);
  const [payment, setPayment] = useState(0);
  const [balance, setBalance] = useState(0);

  // Compute balance dynamically
  useEffect(() => {
    setBalance(Number(lastDayClosing) + Number(receive) - Number(payment));
  }, [lastDayClosing, receive, payment]);

  // Format today's date
  const today = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });

  return (
    <PageLayout>
        <div className={`p-6 h-full ${theme === 'emerald' ? 'bg-gradient-to-br from-emerald-100 to-white text-gray-900' : theme === 'purple' ? 'bg-gradient-to-br from-gray-50 to-gray-200 text-gray-900' : 'bg-gradient-to-b from-gray-900 to-gray-700 text-white'}`}>
             <ContentCard>
          <div className="flex flex-col h-full overflow-hidden gap-2">

            <h2 className="text-xl font-bold text-[#6448AE] mb-2">Cash Closing – {today}</h2>
            <hr className="mb-4 border-gray-300" />

      {/* FORM AREA (STRUCTURE LIKE IMAGE) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-10 max-w-[500px]">

        {/* LABELS */}
        <div className="flex flex-col gap-6 text-base">
          <label className="mt-1">Last Day Closing</label>
          <label className="mt-1">Receive</label>
          <label className="mt-1">Payment</label>
          <label className="mt-1">Balance</label>

          {/* BUTTON (left aligned, below labels) */}
         <button
            className={`border px-4 py-2 rounded text-sm font-medium ${theme === 'emerald' ? 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700 shadow-sm' : theme === 'purple' ? ' bg-[#6448AE] hover:bg-[#6E55B6]  text-white border-[#6448AE]' : 'bg-gray-800 border-gray-600 text-blue-300 hover:bg-gray-700'}`}>Close Day</button>
        </div>

        {/* INPUT FIELDS */}
        <div className="flex flex-col gap-6">
          <InputField
            type="number"
            value={lastDayClosing}
            readOnly
          />

          <InputField
            type="number"
            value={receive}
            readOnly
          />

          <InputField
            type="number"
            value={payment}
            readOnly
          />

          <InputField
            type="number"
            value={balance}
            readOnly
          />
        </div>
      </div>

      </div>
      </ContentCard>
     </div>
    </PageLayout>
  );
};

export default DayClosing;
