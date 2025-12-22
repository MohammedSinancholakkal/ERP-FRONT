import React, { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  BarChart,
  Bar,
  Cell,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import {
  Minimize2,
  Maximize2,
  TrendingUp,
  DollarSign,
  PieChart as PieChartIcon,
  BarChart3,
  X,
} from "lucide-react";

/* =========================
   DATA
========================= */

// Yearly sales & purchase
const yearlyData = [
  { month: "Jan", purchase: 0, sale: 0, expense: 0 },
  { month: "Feb", purchase: 0, sale: 0, expense: 0 },
  { month: "Mar", purchase: 0, sale: 0, expense: 0 },
  { month: "Apr", purchase: 0, sale: 0, expense: 0 },
  { month: "May", purchase: 0, sale: 0, expense: 0 },
  { month: "Jun", purchase: 0, sale: 0, expense: 0 },
  { month: "Jul", purchase: 0, sale: 0, expense: 0 },
  { month: "Aug", purchase: 0, sale: 0, expense: 0 },
  { month: "Sep", purchase: 0, sale: 0, expense: 0 },
  { month: "Oct", purchase: 0, sale: 0, expense: 0 },
  { month: "Nov", purchase: 3600, sale: 200, expense: 300 },
  { month: "Dec", purchase: 0, sale: 450, expense: 50 },
];

// Expense data
const expenseData = [
  { name: "Electricity", value: 100, color: "#8e44ad" },
  { name: "Rent", value: 150, color: "#3498db" },
  { name: "Maintenance", value: 80, color: "#e74c3c" },
  { name: "Marketing", value: 120, color: "#2ecc71" },
];

// Monthly sales (December)
const dailyData = Array.from({ length: 31 }, (_, i) => ({
  day: i + 1,
  sale: i === 9 ? 500 : Math.floor(Math.random() * 100),
  forecast: Math.floor(Math.random() * 150) + 50,
}));

// Best selling products
const productData = [
  { name: "Machine", value: 45, color: "#e84393" },
  { name: "Driller", value: 30, color: "#0984e3" },
  { name: "Hammer", value: 25, color: "#00b894" },
  { name: "Saw", value: 20, color: "#fdcb6e" },
];

/* =========================
   CARD COMPONENT
========================= */
const ChartCard = ({
  title,
  icon,
  children,
  defaultMinimized = false,
  className = "",
}) => {
  const [minimized, setMinimized] = useState(defaultMinimized);
  const [fullscreen, setFullscreen] = useState(false);

  return (
    <>
      {/* FULLSCREEN */}
      {fullscreen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="bg-white w-full h-full rounded-xl p-6 relative">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                {icon}
                <h2 className="text-xl font-semibold text-gray-800">
                  {title}
                </h2>
              </div>
              <button
                onClick={() => setFullscreen(false)}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <X />
              </button>
            </div>
            <div className="h-[calc(100%-60px)]">{children}</div>
          </div>
        </div>
      )}

      {/* CARD */}
      <motion.div
        layout
        transition={{ duration: 0.35, ease: "easeInOut" }}
        className={`bg-white rounded-xl shadow border overflow-hidden ${className}`}
      >
        {/* HEADER (always visible) */}
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex items-center gap-2">
            {icon}
            <h3 className="font-semibold text-gray-800">{title}</h3>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setMinimized(!minimized)}
              className="p-2 hover:bg-gray-100 rounded"
            >
              {minimized ? <Maximize2 /> : <Minimize2 />}
            </button>
            <button
              onClick={() => setFullscreen(true)}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <Maximize2 />
            </button>
          </div>
        </div>

        {/* BODY */}
        <AnimatePresence initial={false}>
          {!minimized && (
            <motion.div
              key="content"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="p-4"
            >
              <div className="h-[350px]">{children}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
};


/* =========================
   CHARTS
========================= */

export const YearlySalesChart = () => (
  <ResponsiveContainer width="100%" height="100%">
    <AreaChart data={yearlyData}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="month" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Area dataKey="sale" stroke="#3498db" fill="#3498db55" />
      <Area dataKey="purchase" stroke="#e74c3c" fill="#e74c3c55" />
      <Area dataKey="expense" stroke="#9b59b6" fill="#9b59b655" />
    </AreaChart>
  </ResponsiveContainer>
);

export const ExpenseChart = () => (
  <ResponsiveContainer width="100%" height="100%">
    <PieChart>
      <Pie data={expenseData} dataKey="value" label>
        {expenseData.map((e, i) => (
          <Cell key={i} fill={e.color} />
        ))}
      </Pie>
      <Tooltip />
    </PieChart>
  </ResponsiveContainer>
);

export const MonthlySalesChart = () => (
  <ResponsiveContainer width="100%" height="100%">
    <LineChart data={dailyData}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="day" />
      <YAxis />
      <Tooltip />
      <Line dataKey="sale" stroke="#3498db" strokeWidth={3} />
      <Line
        dataKey="forecast"
        stroke="#95a5a6"
        strokeDasharray="5 5"
      />
    </LineChart>
  </ResponsiveContainer>
);

export const BestProductChart = () => (
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={productData}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Bar dataKey="value">
        {productData.map((p, i) => (
          <Cell key={i} fill={p.color} />
        ))}
      </Bar>
    </BarChart>
  </ResponsiveContainer>
);

/* =========================
   MAIN PAGE
========================= */
const Charts = () => {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChartCard title="Yearly Performance" icon={<TrendingUp />}>
          <YearlySalesChart />
        </ChartCard>

        <ChartCard title="Monthly Sales" icon={<DollarSign />}>
          <MonthlySalesChart />
        </ChartCard>

        <ChartCard title="Expense Distribution" icon={<PieChartIcon />}>
          <ExpenseChart />
        </ChartCard>

        <ChartCard title="Best Selling Products" icon={<BarChart3 />}>
          <BestProductChart />
        </ChartCard>
      </div>
    </div>
  );
};

export default Charts;
