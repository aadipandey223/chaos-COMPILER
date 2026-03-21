import React from 'react';
import classes from './StatusBadge.module.css';

export default function StatusBadge({ status }) {
  let text = 'Ready';
  let badgeClass = classes.idle;

  if (status === 'compiling') {
    text = 'Compiling...';
    badgeClass = classes.compiling;
  } else if (status === 'success') {
    text = 'Success';
    badgeClass = classes.success;
  } else if (status === 'error') {
    text = 'Error';
    badgeClass = classes.error;
  }

  return (
    <div className={`${classes.badge} ${badgeClass}`}>
      {status === 'compiling' && <span className={classes.spinner}></span>}
      {text}
    </div>
  );
}
