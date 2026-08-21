import { forwardRef } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '../../utils/cn';

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.96 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={cn(
          'inline-flex items-center justify-center rounded-2xl text-sm font-semibold transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none',
          {
            'bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_2px_10px_rgba(0,122,255,0.3)] dark:shadow-[0_2px_15px_rgba(10,132,255,0.4)]': variant === 'primary',
            'glass-button text-foreground': variant === 'secondary',
            'hover:bg-muted text-foreground': variant === 'ghost',
            'bg-destructive/10 text-destructive hover:bg-destructive/20': variant === 'danger',
            'h-9 px-4': size === 'sm',
            'h-11 px-5 py-2 text-base': size === 'md',
            'h-12 px-8 text-lg': size === 'lg',
            'h-11 w-11 p-0 rounded-full': size === 'icon',
          },
          className
        )}
        {...props as any}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };
