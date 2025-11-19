/**
 * Page Transition Components
 * Smooth page transitions and layout animations
 */

'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useAnimation, useReducedMotion } from '@/lib/animations/context';

interface PageTransitionProps {
  children: React.ReactNode;
  animationType?: 'slide' | 'fade' | 'scale' | 'blur' | 'business';
}

const transitionVariants = {
  slide: {
    initial: { x: 300, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -300, opacity: 0 },
  },
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  scale: {
    initial: { scale: 0.9, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 1.1, opacity: 0 },
  },
  blur: {
    initial: { filter: 'blur(10px)', opacity: 0 },
    animate: { filter: 'blur(0px)', opacity: 1 },
    exit: { filter: 'blur(5px)', opacity: 0 },
  },
  business: {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -20, opacity: 0 },
  },
};

export function PageTransition({
  children,
  animationType = 'business'
}: PageTransitionProps) {
  const pathname = usePathname();
  const { config } = useAnimation();
  const isReducedMotion = useReducedMotion();

  const variants = isReducedMotion || !config.enabled
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : transitionVariants[animationType];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={variants}
        transition={{
          duration: isReducedMotion ? 0.1 : 0.3,
          ease: 'easeInOut',
        }}
        style={{
          willChange: config.enableGPUAcceleration ? 'transform, opacity' : 'opacity',
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

interface StaggeredListProps {
  children: React.ReactNode[];
  staggerDelay?: number;
  animationType?: 'slideUp' | 'fadeIn' | 'scale' | 'business';
}

const listVariants = {
  slideUp: {
    container: {
      animate: {
        transition: {
          staggerChildren: 0.1,
          delayChildren: 0.1,
        },
      },
    },
    item: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.3, ease: 'easeOut' },
    },
  },
  fadeIn: {
    container: {
      animate: {
        transition: {
          staggerChildren: 0.05,
          delayChildren: 0.1,
        },
      },
    },
    item: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      transition: { duration: 0.4, ease: 'easeOut' },
    },
  },
  scale: {
    container: {
      animate: {
        transition: {
          staggerChildren: 0.1,
          delayChildren: 0.2,
        },
      },
    },
    item: {
      initial: { opacity: 0, scale: 0.8 },
      animate: { opacity: 1, scale: 1 },
      transition: { duration: 0.4, ease: 'easeOut' },
    },
  },
  business: {
    container: {
      animate: {
        transition: {
          staggerChildren: 0.08,
          delayChildren: 0.1,
        },
      },
    },
    item: {
      initial: { opacity: 0, y: 15 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.3, ease: 'easeOut' },
    },
  },
};

export function StaggeredList({
  children,
  staggerDelay = 0.1,
  animationType = 'business'
}: StaggeredListProps) {
  const { config } = useAnimation();
  const isReducedMotion = useReducedMotion();

  if (isReducedMotion || !config.enabled) {
    return <div>{children}</div>;
  }

  const variants = listVariants[animationType];

  return (
    <motion.div
      variants={variants.container}
      initial="initial"
      animate="animate"
      style={{
        willChange: config.enableGPUAcceleration ? 'transform' : 'auto',
      }}
    >
      {children.map((child, index) => (
        <motion.div
          key={index}
          variants={variants.item}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

interface ScrollRevealProps {
  children: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  animationType?: 'slideUp' | 'slideLeft' | 'slideRight' | 'fade' | 'scale';
}

const scrollVariants = {
  slideUp: {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
  },
  slideLeft: {
    initial: { opacity: 0, x: 60 },
    animate: { opacity: 1, x: 0 },
  },
  slideRight: {
    initial: { opacity: 0, x: -60 },
    animate: { opacity: 1, x: 0 },
  },
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
  },
  scale: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
  },
};

export function ScrollReveal({
  children,
  threshold = 0.1,
  rootMargin = '0px 0px -10% 0px',
  triggerOnce = true,
  animationType = 'slideUp',
}: ScrollRevealProps) {
  const { config } = useAnimation();
  const isReducedMotion = useReducedMotion();

  const variants = isReducedMotion || !config.enabled
    ? { initial: { opacity: 0 }, animate: { opacity: 1 } }
    : scrollVariants[animationType];

  return (
    <motion.div
      initial="initial"
      whileInView="animate"
      viewport={{
        threshold,
        margin: rootMargin,
        once: triggerOnce,
      }}
      variants={variants}
      transition={{
        duration: isReducedMotion ? 0.1 : 0.6,
        ease: 'easeOut',
      }}
      style={{
        willChange: config.enableGPUAcceleration ? 'transform, opacity' : 'opacity',
      }}
    >
      {children}
    </motion.div>
  );
}