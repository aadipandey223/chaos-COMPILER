import React from 'react';
import { motion } from 'framer-motion';
import Button from './Button';
import styles from './EmptyState.module.css';

export default function EmptyState({ icon, heading, description, action, onAction }) {
  return (
    <div className={styles.wrapper}>
      <motion.div 
        initial={{ opacity: 0, y: 15 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.4, ease: "easeOut" }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
      >
        {icon && <div className={styles.icon}>{icon}</div>}
        <h3 className={styles.heading}>{heading}</h3>
        {description && <p className={styles.description}>{description}</p>}
        {action && onAction && (
          <Button variant="secondary" onClick={onAction}>{action}</Button>
        )}
      </motion.div>
    </div>
  );
}
