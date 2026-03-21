import React from 'react';
import { motion } from 'framer-motion';
import styles from './Button.module.css';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  ...props
}) {
  return (
    <motion.button
      type={type}
      className={`${styles.btn} ${styles[variant]} ${styles[size]} ${className}`}
      disabled={disabled}
      onClick={onClick}
      whileTap={disabled ? {} : { scale: 0.97 }}
      transition={{ duration: 0.1 }}
      {...props}
    >
      {children}
    </motion.button>
  );
}
