'use client';
import React from 'react';
import { motion } from 'framer-motion';

interface BusinessModelProps {
  onComplete: () => void;
  voiceEnabled: boolean;
}

export default function BusinessModel({ onComplete }: BusinessModelProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[#0B1A3B]"
    >
      {/* Back button */}
      <button
        onClick={onComplete}
        className="fixed top-4 left-4 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white text-sm transition-all backdrop-blur-sm"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <iframe
        src="/business-model.html"
        className="w-full h-full border-none"
        title="EaaS Financial Model"
      />
    </motion.div>
  );
}
