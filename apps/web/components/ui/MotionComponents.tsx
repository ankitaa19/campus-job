import React from 'react';
import { motion } from 'framer-motion';
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Inline cn function to avoid import issues
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface MotionCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  hover?: boolean;
}

const MotionCard: React.FC<MotionCardProps> = ({
  children,
  className,
  delay = 0,
  direction = 'up',
  hover = true
}) => {
  const directions = {
    up: { y: 20 },
    down: { y: -20 },
    left: { x: -20 },
    right: { x: 20 }
  };

  const hoverEffects = hover ? {
    scale: 1.02,
    y: -5,
    transition: { duration: 0.2 }
  } : {};

  return (
    <motion.div
      initial={{ 
        opacity: 0, 
        ...directions[direction]
      }}
      animate={{ 
        opacity: 1, 
        x: 0, 
        y: 0 
      }}
      transition={{ 
        duration: 0.6, 
        delay,
        ease: "easeOut"
      }}
      whileHover={hoverEffects}
      className={cn(
        "rounded-xl bg-white shadow-lg border border-gray-100 overflow-hidden",
        className
      )}
    >
      {children}
    </motion.div>
  );
};

interface FloatingElementProps {
  children: React.ReactNode;
  className?: string;
  duration?: number;
  offset?: number;
}

const FloatingElement: React.FC<FloatingElementProps> = ({
  children,
  className,
  duration = 4,
  offset = 20
}) => {
  return (
    <motion.div
      initial={{ 
        opacity: 0,
        y: 50,
        scale: 0.8 
      }}
      animate={{
        opacity: 1,
        y: [-offset, offset * 1.5, -offset],
        x: [-offset/2, offset/2, -offset/2],
        rotate: [-3, 3, -3],
        scale: [1, 1.03, 1],
      }}
      transition={{
        opacity: { duration: 1 },
        y: { duration, repeat: Infinity, ease: "easeInOut" },
        x: { duration, repeat: Infinity, ease: "easeInOut" },
        rotate: { duration, repeat: Infinity, ease: "easeInOut" },
        scale: { duration, repeat: Infinity, ease: "easeInOut" },
        times: [0, 0.5, 1]
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

interface FadeInViewProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

const FadeInView: React.FC<FadeInViewProps> = ({
  children,
  className,
  delay = 0
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ 
        duration: 0.6, 
        delay,
        ease: "easeOut"
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

interface StaggerContainerProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}

const StaggerContainer: React.FC<StaggerContainerProps> = ({
  children,
  className,
  staggerDelay = 0.1
}) => {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay
          }
        }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const StaggerItem: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className
}) => {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export { MotionCard, FloatingElement, FadeInView, StaggerContainer, StaggerItem };
