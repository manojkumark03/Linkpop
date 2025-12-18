'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { Card } from '@acme/ui';

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function AnimatedCard({ children, className = '', delay = 0 }: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay, ease: 'easeOut' }}
      className="w-full"
    >
      <Card className={className}>{children}</Card>
    </motion.div>
  );
}
