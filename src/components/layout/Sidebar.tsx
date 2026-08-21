import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Calendar as CalendarIcon, BookOpen, Settings, Target } from 'lucide-react';
import { cn } from '../../utils/cn';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Calendar', path: '/calendar', icon: CalendarIcon },
  { name: 'Subjects', path: '/subjects', icon: BookOpen },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-[280px] flex-col hidden md:flex h-screen p-4 sticky top-0 perspective-1000">
      <motion.div 
        initial={{ opacity: 0, x: -50, rotateY: -10 }}
        animate={{ opacity: 1, x: 0, rotateY: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="glass h-full rounded-[2.5rem] flex flex-col p-4 relative overflow-hidden shadow-2xl"
      >
        <div className="flex items-center gap-3 px-4 py-6 mb-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-[14px] bg-gradient-to-br from-zinc-800 to-black dark:from-zinc-700 dark:to-zinc-900 border border-white/10 flex items-center justify-center text-white font-bold shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-primary/20" />
            <Target className="w-5 h-5 text-primary relative z-10" />
          </div>
          <h1 className="flex flex-col font-black text-xl tracking-tighter uppercase text-foreground/90 leading-tight">
            <span>Operation</span>
            <span className="text-primary">Tadipar</span>
          </h1>
        </div>

        <nav className="flex-1 space-y-1.5 px-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative',
                  isActive
                    ? 'text-primary font-semibold'
                    : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 bg-primary/10 dark:bg-primary/20 rounded-2xl"
                    initial={false}
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  />
                )}
                
                <item.icon className={cn("w-5 h-5 relative z-10 transition-transform duration-300", isActive ? "scale-110" : "group-hover:scale-110")} />
                <span className="relative z-10">{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </motion.div>
    </aside>
  );
}
