import React, { useEffect, useState } from "react";
import { useNavigation } from "react-router-dom";

import { AnimatePresence, m } from "framer-motion";

import { useLoader } from "@services/helpers/loading.hook";

const ProgressBar: React.FC = () => {
  const navigation = useNavigation();
  const { isLoading: isGlobalLoading } = useLoader("GLOBAL_ROUTER");

  const isRouterLoading =
    navigation.state === "loading" || navigation.state === "submitting";
  const showProgress = isRouterLoading || isGlobalLoading;

  const [progress, setProgress] = useState(0);
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let hideTimeout: NodeJS.Timeout;

    if (showProgress) {
      setShouldShow(true);
      setProgress(0);
      // Simulate progress
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          // Slow down as it gets higher
          const increment = Math.max(1, (90 - prev) / 10);
          return prev + increment;
        });
      }, 200);
    } else {
      setProgress(100);
      // Hide after exit animation completes (0.5s duration + 0.2s delay = 0.7s)
      hideTimeout = setTimeout(() => {
        setShouldShow(false);
        setProgress(0); // Reset progress for next time
      }, 700);
    }

    return () => {
      clearInterval(interval);
      clearTimeout(hideTimeout);
    };
  }, [showProgress]);

  return (
    <AnimatePresence>
      {shouldShow && (
        <m.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }} // Wait a bit before fading out
          className="fixed top-0 left-0 right-0 z-[var(--z-dropdown)] h-1 bg-transparent"
        >
          <m.div
            className="h-full bg-blue-600 shadow-[0_0_10px_#2563eb]"
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ ease: "easeOut", duration: 0.2 }}
          />
        </m.div>
      )}
    </AnimatePresence>
  );
};

export default ProgressBar;
