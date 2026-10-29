import React from "react";

import { m } from "framer-motion";

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-full">
      <m.div
        className="h-12 w-12 rounded-full border-4 border-gray-200 border-t-blue-600"
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </div>
  );
};
