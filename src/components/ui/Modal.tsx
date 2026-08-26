import { type ReactNode, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../utils/cn';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 perspective-1000">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-md"
            onClick={onClose}
          />
          
          {/* Modal Content */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20, rotateX: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20, rotateX: -10 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className={cn(
              "glass-panel relative w-full max-w-md rounded-[2rem] p-6 flex flex-col max-h-[90vh] shadow-[0_20px_50px_rgba(0,0,0,0.3)] origin-bottom",
              className
            )}
          >
            <div className="flex items-center justify-between mb-6 pb-2 border-b border-border/50">
              <h2 className="text-xl font-bold tracking-tight">{title}</h2>
              <Button variant="secondary" size="icon" onClick={onClose} className="h-8 w-8 rounded-full bg-muted/50 hover:bg-muted">
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="overflow-y-auto overflow-x-hidden flex-1 -mx-2 px-2 custom-scrollbar">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
