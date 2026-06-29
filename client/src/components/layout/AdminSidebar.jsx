import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function AdminSidebar({ activeTab, onTabChange, tabs = [], unreadCount = 0 }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      initial={{ x: -10, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={[
        "bg-rough flex flex-col transition-all duration-300 fixed left-0 top-14 h-[calc(100vh-3.5rem)] shrink-0 z-40",
        "border-r border-rough-light/20",
        collapsed ? "w-16" : "w-60",
      ].join(" ")}
      aria-label="Admin navigation"
    >
      {/* Logo */}
      <div
        className={[
          "flex items-center gap-3 px-4 py-5 border-b border-rough-light/20",
          collapsed ? "justify-center" : "",
        ].join(" ")}
      >
        <span className="text-2xl shrink-0" aria-hidden="true">
          🏨
        </span>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <p className="font-display font-semibold text-pale-light text-sm leading-tight whitespace-nowrap">
                Habesha Grand
              </p>
              <p className="text-xs text-gold-muted whitespace-nowrap">
                Admin Panel
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-3">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              aria-label={tab.label}
              aria-current={isActive ? "page" : undefined}
              className={[
                "w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-150 relative",
                "hover:bg-rough-light/40",
                collapsed ? "justify-center" : "",
                isActive
                  ? "text-gold-hover bg-rough-light/30"
                  : "text-pale/70 hover:text-pale",
              ].join(" ")}
            >
              {/* Active left border */}
              {isActive && (
                <motion.span
                  layoutId="sidebar-indicator"
                  className="absolute left-0 top-1 bottom-1 w-1 bg-gold-hover rounded-r-full"
                />
              )}
              <div className="relative">
                {Icon && (
                  <Icon
                    size={18}
                    strokeWidth={isActive ? 2 : 1.5}
                    className={isActive ? "text-gold-hover" : "text-pale/50"}
                    aria-hidden="true"
                  />
                )}
                {/* Badge for manager calls */}
                {tab.id === 'manager' && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full px-1 shadow">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="truncate"
                  >
                    {tab.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="absolute -right-3 top-20 w-6 h-6 bg-rough border border-rough-light/30 rounded-full flex items-center justify-center text-gold-muted hover:text-gold transition-colors shadow-sm z-10"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </motion.aside>
  );
}

export default AdminSidebar;
