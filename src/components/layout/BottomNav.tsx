import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Calendar as CalendarIcon, BookOpen, Settings, UsersRound } from 'lucide-react';
import { cn } from '../../utils/cn';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Calendar', path: '/calendar', icon: CalendarIcon },
  { name: 'Subjects', path: '/subjects', icon: BookOpen },
  { name: 'Groups', path: '/groups', icon: UsersRound },
  { name: 'Profile', path: '/profile', icon: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="md:hidden fixed bottom-6 left-6 right-6 z-40">
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 25, delay: 0.1 }}
        className="glass rounded-full flex items-center justify-between p-2 shadow-2xl mx-auto max-w-sm"
      >
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'relative flex flex-col items-center justify-center w-14 h-14 rounded-full transition-all duration-300',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-active"
                  className="absolute inset-0 bg-primary/10 dark:bg-primary/20 rounded-full"
                  initial={false}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                />
              )}
              <item.icon className={cn("w-6 h-6 relative z-10 transition-transform duration-300", isActive ? "scale-110" : "")} />
            </NavLink>
          );
        })}
      </motion.div>
    </nav>
  );
}
