import { Minus, Plus, X } from "lucide-react";
import { useState } from "react";

const DashboardCard = ({ title, color, children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="rounded-lg overflow-hidden shadow border border-gray-700 bg-gradient-to-b from-[#3a3344] to-[#2b2533]">
      {/* Header */}
      <div className="relative px-4 py-3 border-b border-gray-700 flex justify-between items-center">
        <div className={`absolute top-0 left-0 h-[3px] w-full ${color}`} />

        <h3 className="font-semibold text-lg">{title}</h3>

        <div className="flex gap-4">
          {collapsed ? (
            <Plus
              size={18}
              onClick={() => setCollapsed(false)}
              className="cursor-pointer hover:text-green-400"
            />
          ) : (
            <Minus
              size={18}
              onClick={() => setCollapsed(true)}
              className="cursor-pointer hover:text-gray-300"
            />
          )}
          <X
            size={18}
            onClick={() => setVisible(false)}
            className="cursor-pointer hover:text-red-400"
          />
        </div>
      </div>

      {/* Body */}
      {!collapsed && <div className="p-4 h-72">{children}</div>}
    </div>
  );
};

export default DashboardCard;
