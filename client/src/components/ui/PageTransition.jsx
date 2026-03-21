import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { pageVariants } from '../../utils/motionVariants';

export default function PageTransition({ children }) {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        style={{ height: '100%', width: '100%' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
