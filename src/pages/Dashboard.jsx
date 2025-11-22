import React from "react";
import { Minus, X } from "lucide-react";


const Dashboard = () => {
  return (
    <>
    <div className="bg-gradient-to-b from-gray-900 to-gray-700 p-6 min-h-screen text-white">
      <h2 className="text-2xl font-semibold mb-4">
        Dashboard
      </h2>

      {/* Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-500 text-white p-4 rounded-lg shadow">
          <h3 className="text-3xl font-bold">0.00</h3>
          <p>Today's Sale</p>
          <button className="text-xs mt-2 underline">More info</button>
        </div>

        <div className="bg-green-500 text-white p-4 rounded-lg shadow">
          <h3 className="text-3xl font-bold">0</h3>
          <p>Total Suppliers</p>
          <button className="text-xs mt-2 underline">More info</button>
        </div>

        <div className="bg-yellow-500 text-white p-4 rounded-lg shadow">
          <h3 className="text-3xl font-bold">1</h3>
          <p>Total Customers</p>
          <button className="text-xs mt-2 underline">More info</button>
        </div>

        <div className="bg-red-500 text-white p-4 rounded-lg shadow">
          <h3 className="text-3xl font-bold">0</h3>
          <p>Total Products</p>
          <button className="text-xs mt-2 underline">More info</button>
        </div>
      </div>



      <div className="p-4 min-h-screen bg-gradient-to-b from-gray-900 to-gray-700 text-white">


{/* ========= GRID LAYOUT 2×2 ========= */}
<div className="grid grid-cols-2 gap-6">

  {/* =================== CARD 1 =================== */}
  <div className="rounded-lg overflow-hidden shadow border border-gray-700 bg-gradient-to-b from-[#3a3344] to-[#2b2533]">

    {/* Header */}
    <div className="relative px-4 py-3 border-b border-gray-700 flex justify-between items-center">
      <div className="absolute top-0 left-0 h-[3px] w-full bg-blue-400"></div>

      <h3 className="font-semibold text-lg">
        Sales And Purchase Report Summary – 2025
      </h3>

      <div className="flex gap-4">
        <Minus size={18} className="cursor-pointer hover:text-gray-300" />
        <X size={18} className="cursor-pointer hover:text-red-400" />
      </div>
    </div>

    {/* Chart Area */}
    <div className="p-4 h-72 flex items-center justify-center text-gray-400">
      Chart goes here
    </div>
  </div>

  {/* =================== CARD 2 =================== */}
  <div className="rounded-lg overflow-hidden shadow border border-gray-700 bg-gradient-to-b from-[#3a3344] to-[#2b2533]">

    <div className="relative px-4 py-3 border-b border-gray-700 flex justify-between items-center">
      <div className="absolute top-0 left-0 h-[3px] w-full bg-red-400"></div>

      <h3 className="font-semibold text-lg">Expense Statement – 2025</h3>

      <div className="flex gap-4">
        <Minus size={18} className="cursor-pointer hover:text-gray-300" />
        <X size={18} className="cursor-pointer hover:text-red-400" />
      </div>
    </div>

    <div className="p-4 h-72 flex items-center justify-center text-gray-400">
      Content goes here
    </div>
  </div>

  {/* =================== CARD 3 =================== */}
  <div className="rounded-lg overflow-hidden shadow border border-gray-700 bg-gradient-to-b from-[#3a3344] to-[#2b2533]">

    <div className="relative px-4 py-3 border-b border-gray-700 flex justify-between items-center">
      <div className="absolute top-0 left-0 h-[3px] w-full bg-blue-400"></div>

      <h3 className="font-semibold text-lg">
        Sales And Purchase Report Summary (November) – 2025
      </h3>

      <div className="flex gap-4">
        <Minus size={18} className="cursor-pointer hover:text-gray-300" />
        <X size={18} className="cursor-pointer hover:text-red-400" />
      </div>
    </div>

    <div className="p-4 h-72 flex items-center justify-center text-gray-400">
      Chart goes here
    </div>
  </div>

  {/* =================== CARD 4 =================== */}
  <div className="rounded-lg overflow-hidden shadow border border-gray-700 bg-gradient-to-b from-[#3a3344] to-[#2b2533]">

    <div className="relative px-4 py-3 border-b border-gray-700 flex justify-between items-center">
      <div className="absolute top-0 left-0 h-[3px] w-full bg-green-400"></div>

      <h3 className="font-semibold text-lg">Best Sale Product – 2025</h3>

      <div className="flex gap-4">
        <Minus size={18} className="cursor-pointer hover:text-gray-300" />
        <X size={18} className="cursor-pointer hover:text-red-400" />
      </div>
    </div>

    <div className="p-4 h-72 flex items-center justify-center text-gray-400">
      Chart goes here
    </div>
  </div>

</div>
</div>
    </div>

  


</>

  );
};

export default Dashboard;
