import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const KPICard = ({ title, value, suffix = '', icon: Icon, color, tooltip, delay = 0, to }) => {
  const [count, setCount] = useState(0);
  // A momentarily undefined/NaN value (e.g. stats still loading, or a stale API
  // response shape) should render as 0, never "NaN".
  const safeValue = Number.isFinite(value) ? value : 0;

  useEffect(() => {
    const timeout = setTimeout(() => {
      let start = 0;
      const inc = safeValue / 40;
      const timer = setInterval(() => {
        start += inc;
        if (start >= safeValue) { setCount(safeValue); clearInterval(timer); }
        else setCount(Math.floor(start));
      }, 25);
      return () => clearInterval(timer);
    }, delay);
    return () => clearTimeout(timeout);
  }, [safeValue, delay]);

  const content = (
    <>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold text-foreground animate-count-up">{count}{suffix}</p>
      </div>
    </>
  );

  const card = (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay / 1000, duration: 0.4 }}
      className={`glass-card p-5 flex items-start gap-4 hover:glow-primary transition-shadow duration-300 ${to ? 'cursor-pointer' : ''}`}
    >
      {to ? <Link to={to} className="flex items-start gap-4 w-full">{content}</Link> : content}
    </motion.div>
  );

  if (tooltip) return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>{card}</TooltipTrigger>
      <TooltipContent><p className="text-xs max-w-[200px]">{tooltip}</p></TooltipContent>
    </Tooltip>
  );

  return card;
};

export default KPICard;
