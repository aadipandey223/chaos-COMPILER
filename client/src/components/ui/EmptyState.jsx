import React from 'react';
import Button from './Button';
import styles from './EmptyState.module.css';

export default function EmptyState({ icon, heading, description, action, onAction }) {
  return (
    <div className={styles.wrapper}>
      {icon && <div className={styles.icon}>{icon}</div>}
      <h3 className={styles.heading}>{heading}</h3>
      {description && <p className={styles.description}>{description}</p>}
      {action && onAction && (
        <Button variant="secondary" onClick={onAction}>{action}</Button>
      )}
    </div>
  );
}
