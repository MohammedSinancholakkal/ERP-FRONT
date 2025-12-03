import React, { useState, useEffect } from "react";

const DayClosing = () => {
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
    <div className="p-8 text-white bg-gradient-to-b from-gray-900 to-gray-800 min-h-[calc(100vh-64px)]">

      {/* PAGE TITLE */}
      <h2 className="text-2xl font-semibold mb-6">
        Cash Closing – {today}
      </h2>

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
            className="w-32 mt-4 bg-gray-800 border border-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm">Close Day</button>
        </div>

        {/* INPUT FIELDS */}
        <div className="flex flex-col gap-6">
          <input
            type="number"
            value={lastDayClosing}
            onChange={(e) => setLastDayClosing(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded px-3 py-2"
          />

          <input
            type="number"
            value={receive}
            onChange={(e) => setReceive(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded px-3 py-2"
          />

          <input
            type="number"
            value={payment}
            onChange={(e) => setPayment(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded px-3 py-2"
          />

          <input
            type="number"
            value={balance}
            disabled
            className="bg-gray-900 border border-gray-700 rounded px-3 py-2"
          />
        </div>
      </div>

    </div>
  );
};

export default DayClosing;
