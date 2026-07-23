import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Shield,
  MessageSquare,
  Send,
  Info,
  Map,
  Sun,
  Moon,
  AlertOctagon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useMessageNotifications } from "@/hooks/useMessageNotifications";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "Live Tracking", icon: Map, path: "/live-tracking" },
  { label: "Driver List", icon: Users, path: "/drivers" },
  { label: "Add Driver", icon: UserPlus, path: "/drivers/add" },
  { label: "All Violations", icon: AlertOctagon, path: "/violations/all" },
  { label: "Messages", icon: MessageSquare, path: "/messages" },
  { label: "Send Message", icon: Send, path: "/send-message" },
  { label: "Daily Report", icon: FileText, path: "/daily-report" },
  { label: "Summary", icon: BarChart3, path: "/summary" },
  { label: "Severity Info", icon: Info, path: "/severity-info" },
  { label: "Settings", icon: Settings, path: "/settings" },
];

const DashboardLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { logout, companyInfo } = useAuth();
  const { theme, toggleTheme } = useTheme();
  useMessageNotifications();
  const location = useLocation();
  const navigate = useNavigate();
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("justLoggedIn") === "1") {
      sessionStorage.removeItem("justLoggedIn");
      setShowWelcome(true);
      const timer = setTimeout(() => setShowWelcome(false), 4000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Highlight only the most specific matching nav item, so a sub-route like
  // /drivers/add doesn't also light up the broader /drivers (Driver List) entry.
  const activeItemPath = (() => {
    const pathname = location.pathname;
    let best = null;
    for (const item of navItems) {
      const matches = item.path === "/"
        ? pathname === "/"
        : pathname === item.path || pathname.startsWith(item.path + "/");
      if (matches && (!best || item.path.length > best.length)) best = item.path;
    }
    return best;
  })();

  const isActive = (path) => path === activeItemPath;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 flex items-center gap-3 border-b border-sidebar-border">
        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
          <Shield className="w-5 h-5 text-primary-foreground" />
        </div>
        {!collapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-hidden">
            <p className="font-bold text-sidebar-accent-foreground text-sm leading-tight">DMS Admin</p>
            <p className="text-xs text-sidebar-foreground truncate">{companyInfo?.companyName || 'Fleet Monitor'}</p>
          </motion.div>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = isActive(item.path);
          const link = (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group
                ${active
                  ? 'bg-primary/15 text-primary glow-primary'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                }`}
            >
              <item.icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-primary' : ''}`} />
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && active && <ChevronRight className="w-4 h-4 ml-auto text-primary" />}
            </Link>
          );
          return collapsed ? (
            <Tooltip key={item.path} delayDuration={0}>
              <TooltipTrigger asChild>{link}</TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          ) : link;
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive transition-all w-full"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex w-full">
      <motion.aside
        animate={{ width: collapsed ? 72 : 256 }}
        transition={{ duration: 0.2 }}
        className="hidden md:flex flex-col bg-sidebar border-r border-sidebar-border flex-shrink-0 h-screen sticky top-0"
      >
        <SidebarContent />
      </motion.aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed left-0 top-0 bottom-0 w-[280px] bg-sidebar border-r border-sidebar-border z-50 md:hidden"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border bg-card/50 backdrop-blur-sm flex items-center px-4 gap-4 sticky top-0 z-30">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="hidden md:flex" onClick={() => setCollapsed((c) => !c)}>
            {collapsed ? <Menu className="w-5 h-5" /> : <X className="w-4 h-4" />}
          </Button>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
              {companyInfo?.companyName?.[0]?.toUpperCase() || "A"}
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </div>

      <AnimatePresence>
        {showWelcome && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 glass-card px-5 py-3 shadow-lg flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Welcome back!</p>
              <p className="text-xs text-muted-foreground">{companyInfo?.companyName || 'Fleet Monitor'}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DashboardLayout;
