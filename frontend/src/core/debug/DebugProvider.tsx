import React from "react";
import { DebugFloatingTrigger } from "./DebugFloatingTrigger";
import { debugConfig } from "./config";

export interface DebugProviderProps {
  children: React.ReactNode;
}

export const DebugProvider: React.FC<DebugProviderProps> = ({ children }) => {
  return (
    <>
      {children}
      {debugConfig.isEnabled && <DebugFloatingTrigger />}
    </>
  );
};
