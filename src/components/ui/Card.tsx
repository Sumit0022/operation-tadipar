import { forwardRef } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '../../utils/cn';

export interface CardProps extends Omit<HTMLMotionProps<"div">, "ref"> {
  interactive?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, interactive, ...props }, ref) => (
    <motion.div
      ref={ref}
      whileHover={interactive ? { y: -4, scale: 1.01 } : undefined}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={cn(
        'glass rounded-3xl p-6 relative overflow-hidden',
        interactive && 'cursor-pointer hover:shadow-2xl transition-shadow duration-300',
        className
      )}
      {...props as any}
    />
  )
);
Card.displayName = 'Card';

export { Card };
