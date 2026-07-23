import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Bell, Percent, SlidersHorizontal, ChevronRight } from 'lucide-react';

const settingsItems = [
  { label: 'Account Management', description: 'View & edit company profile', icon: User, path: '/settings/account' },
  { label: 'Performance Thresholds', description: 'Adjust performance badge scoring', icon: SlidersHorizontal, path: '/settings/thresholds' },
  { label: 'Automated Notifications', description: 'Configure violation alert messages', icon: Bell, path: '/settings/notifications' },
  { label: 'Penalty Settings', description: 'Set penalty % deduction per violation type', icon: Percent, path: '/settings/penalties' },
];

const Settings = () => (
  <div className="space-y-6 max-w-2xl mx-auto">
    <div>
      <h1 className="text-2xl font-bold text-foreground">Settings</h1>
      <p className="text-muted-foreground text-sm">Manage your dashboard configuration</p>
    </div>

    <div className="space-y-3">
      {settingsItems.map((item, i) => (
        <motion.div key={item.path} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
          <Link to={item.path} className="glass-card p-5 flex items-center gap-4 hover:glow-primary transition-all duration-200 block">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <item.icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground text-sm">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </Link>
        </motion.div>
      ))}
    </div>
  </div>
);

export default Settings;
