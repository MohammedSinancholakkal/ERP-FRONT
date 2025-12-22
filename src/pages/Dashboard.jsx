import React from "react";
import { useNavigate } from "react-router-dom";
import {
  YearlySalesChart,
  ExpenseChart,
  MonthlySalesChart,
  BestProductChart,
} from "../components/charts";
import DashboardCard from "../components/DashboardCard";

/* =========================
   SUB SECTIONS
========================= */

const LatestOrders = () => {
  return (
    <DashboardCard title="Latest Orders" color="bg-cyan-400">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-500 text-left">
            <th className="pb-2">Order ID</th>
            <th className="pb-2">Item</th>
            <th className="pb-2">Quantity</th>
            <th className="pb-2">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-gray-700">
            <td className="py-2 text-orange-400">2</td>
            <td>machine</td>
            <td>1</td>
            <td>0.1</td>
          </tr>
        </tbody>
      </table>

      <div className="flex justify-between items-center mt-4">
        <button className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded text-sm">
          Place New Order
        </button>
        <button className="border border-gray-400 px-4 py-2 rounded text-sm">
          View All Orders
        </button>
      </div>
    </DashboardCard>
  );
};

const RecentlyAddedProducts = () => {
  const products = [
    { name: "driller", desc: "hfcfgc", qty: 100 },
    { name: "machine", desc: "hvbhvbhv", qty: 0.1 },
  ];

  return (
    <DashboardCard title="Recently Added Products" color="bg-purple-400">
      <div className="space-y-4">
        {products.map((p, i) => (
          <div
            key={i}
            className="flex items-center justify-between border-b border-gray-600 pb-3"
          >
            <div className="flex gap-3 items-center">
              <div className="w-12 h-12 bg-gray-300 text-gray-700 flex items-center justify-center text-xs rounded">
                50×50
              </div>
              <div>
                <p className="text-yellow-400 font-semibold">{p.name}</p>
                <p className="text-gray-300 text-xs">{p.desc}</p>
              </div>
            </div>
            <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded">
              {p.qty}
            </span>
          </div>
        ))}
      </div>

      <div className="text-center mt-4 text-yellow-400 text-sm cursor-pointer">
        View All Products
      </div>
    </DashboardCard>
  );
};

/* =========================
   MAIN DASHBOARD
========================= */

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-gradient-to-b from-gray-900 to-gray-700 p-6 min-h-screen text-white">
      <h2 className="text-2xl font-semibold mb-4">Dashboard</h2>

      {/* ================= TOP STATS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-500 p-4 rounded-lg shadow">
          <h3 className="text-3xl font-bold">0.00</h3>
          <p>Today's Sale</p>
          <button
            onClick={() => navigate("/app/sales/sales")}
            className="text-xs mt-2 underline"
          >
            More info
          </button>
        </div>

        <div className="bg-green-500 p-4 rounded-lg shadow">
          <h3 className="text-3xl font-bold">0</h3>
          <p>Total Suppliers</p>
          <button
            onClick={() => navigate("/app/businesspartners/suppliers")}
            className="text-xs mt-2 underline"
          >
            More info
          </button>
        </div>

        <div className="bg-yellow-500 p-4 rounded-lg shadow">
          <h3 className="text-3xl font-bold">1</h3>
          <p>Total Customers</p>
          <button
            onClick={() => navigate("/app/businesspartners/customers")}
            className="text-xs mt-2 underline"
          >
            More info
          </button>
        </div>

        <div className="bg-red-500 p-4 rounded-lg shadow">
          <h3 className="text-3xl font-bold">0</h3>
          <p>Total Products</p>
          <button
            onClick={() => navigate("/app/inventory/products")}
            className="text-xs mt-2 underline"
          >
            More info
          </button>
        </div>
      </div>

      {/* ================= CHARTS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DashboardCard
          title="Sales And Purchase Report Summary – 2025"
          color="bg-blue-400"
        >
          <YearlySalesChart />
        </DashboardCard>

        <DashboardCard
          title="Expense Statement – 2025"
          color="bg-red-400"
        >
          <ExpenseChart />
        </DashboardCard>

        <DashboardCard
          title="Sales And Purchase Report Summary (December) – 2025"
          color="bg-blue-400"
        >
          <MonthlySalesChart />
        </DashboardCard>

        <DashboardCard
          title="Best Sale Product – 2025"
          color="bg-green-400"
        >
          <BestProductChart />
        </DashboardCard>
      </div>

      {/* ================= BOTTOM SECTIONS ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <LatestOrders />
        <RecentlyAddedProducts />
      </div>
    </div>
  );
};

export default Dashboard;
