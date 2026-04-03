'use client';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, CornerUpLeft } from 'lucide-react';

interface SlideNavProps {
  onPrev?: () => void;
  onNext?: () => void;
  onBack: () => void;
  showPrev?: boolean;
  showNext?: boolean;
  currentSlide?: number;
  totalSlides?: number;
  prevLabel?: string;
  nextLabel?: string;
  isDark?: boolean; // true = dark background, false = light background
}

export default function SlideNav({
  onPrev,
  onNext,
  onBack,
  showPrev = true,
  showNext = true,
  currentSlide,
  totalSlides,
  prevLabel,
  nextLabel,
  isDark = false,
}: SlideNavProps) {
  // Adaptive colors based on background
  const colors = isDark
    ? {
        text: 'text-white/70',
        textHover: 'hover:text-white',
        border: 'border-white/30',
        borderHover: 'hover:border-white/50',
        bg: 'hover:bg-white/10',
        counter: 'text-white/25',
      }
    : {
        text: 'text-zinc-500',
        textHover: 'hover:text-zinc-800',
        border: 'border-zinc-300',
        borderHover: 'hover:border-zinc-400',
        bg: 'hover:bg-zinc-100',
        counter: 'text-zinc-400',
      };

  const buttonBase = `
    flex items-center gap-2
    px-4 py-2.5
    rounded-full
    border
    transition-all duration-200
    text-sm font-medium tracking-wide
    ${colors.text} ${colors.textHover}
    ${colors.border} ${colors.borderHover}
    ${colors.bg}
  `;

  return (
    <div className="fixed bottom-8 left-0 right-0 z-50 px-6 sm:px-10">
      <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
        {/* Left: PREV button */}
        <div className="flex-1 flex justify-start">
          {showPrev && onPrev ? (
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={onPrev}
              className={buttonBase}
            >
              <ChevronLeft className="w-5 h-5" strokeWidth={1.5} />
              <span>{prevLabel || 'PREV'}</span>
            </motion.button>
          ) : (
            <div className="opacity-0 pointer-events-none" />
          )}
        </div>

        {/* Center: Counter + Back to Topics */}
        <div className="flex flex-col items-center gap-2">
          {/* Slide counter */}
          {currentSlide !== undefined && totalSlides !== undefined && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`text-xs tracking-[0.15em] font-medium ${colors.counter}`}
            >
              {currentSlide + 1} / {totalSlides}
            </motion.div>
          )}

          {/* Back to Topics button */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={onBack}
            className={buttonBase}
          >
            <CornerUpLeft className="w-5 h-5" strokeWidth={1.5} />
            <span>Back to Topics</span>
          </motion.button>
        </div>

        {/* Right: NEXT button */}
        <div className="flex-1 flex justify-end">
          {showNext && onNext ? (
            <motion.button
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={onNext}
              className={buttonBase}
            >
              <span>{nextLabel || 'NEXT'}</span>
              <ChevronRight className="w-5 h-5" strokeWidth={1.5} />
            </motion.button>
          ) : (
            <div className="opacity-0 pointer-events-none" />
          )}
        </div>
      </div>
    </div>
  );
}
