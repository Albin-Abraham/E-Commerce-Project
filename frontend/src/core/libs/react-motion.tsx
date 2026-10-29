// --------------- Framer-Motion Wrapper ----------------------
import { type ReactNode } from "react";

import { LazyMotion, domAnimation, m } from "framer-motion";
import type { HTMLMotionProps } from "framer-motion";

import { Zenith } from "@shared/theme";

export interface FramerMotionProps extends HTMLMotionProps<"div"> {
  children?: ReactNode;
  className?: string;
  variant?: "swipeBottom" | "swipeLeft" | "swipeRight" | "fade" | "scale";
  zIndex?: keyof typeof Zenith.tokens.zIndices;
}

const DefaultStyle = {
  initial: { opacity: 0, y: 10 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
};

export function FramerMotion({
  children,
  className,
  variant,
  zIndex,
  ...props
}: FramerMotionProps) {
  // Resolve variant from theme if provided
  const variantProps =
    variant === "swipeBottom"
      ? Zenith.patterns.motionVariants.swipeIn.bottom
      : variant === "swipeLeft"
        ? Zenith.patterns.motionVariants.swipeIn.left
        : variant === "swipeRight"
          ? Zenith.patterns.motionVariants.swipeIn.right
          : variant === "fade"
            ? Zenith.patterns.motionVariants.fade
            : variant === "scale"
              ? Zenith.patterns.motionVariants.scale
              : !variant
                ? DefaultStyle
                : {};

  // Resolve semantic z-index
  const zClass = zIndex ? Zenith.z(zIndex) : "";

  return (
    <LazyMotion features={domAnimation} strict>
      <m.div
        className={`${zClass} ${className || ""}`}
        {...variantProps}
        {...props}
      >
        {children}
      </m.div>
    </LazyMotion>
  );
}

// ------------------- End -------------- //
