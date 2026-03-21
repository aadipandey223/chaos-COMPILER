import React from 'react';
import styles from './Card.module.css';

export default function Card({ children, className = '', onClick, ...props }) {
  return (
    <div
      className={`${styles.card} ${onClick ? styles.clickable : ''} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
}
