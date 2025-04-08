import { motion } from 'framer-motion';
import { useState } from 'react';

interface FuturisticButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'default' | 'outline' | 'neon' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export function FuturisticButton({
  children,
  onClick,
  className = '',
  variant = 'default',
  size = 'md',
  disabled = false,
  type = 'button'
}: FuturisticButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  const baseClasses = 'relative rounded-md font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2';

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const variantClasses = {
    default: 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 focus:ring-purple-500',
    outline: 'border-2 border-indigo-500 bg-transparent text-indigo-500 hover:bg-indigo-500 hover:text-white focus:ring-indigo-500',
    neon: 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 focus:ring-purple-500',
    ghost: 'bg-transparent text-indigo-500 hover:bg-indigo-50 focus:ring-indigo-500'
  };

  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';

  return (
    <motion.button
      type={type}
      onClick={onClick}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${disabledClasses} ${className}`}
      whileHover={{ scale: disabled ? 1 : 1.03 }}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      disabled={disabled}
    >
      {variant === 'neon' && isHovered && (
        <motion.span
          className="absolute inset-0 -z-10 rounded-md bg-neon-blue/40"
          layoutId="button-hover"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        />
      )}
      {children}
    </motion.button>
  );
}
