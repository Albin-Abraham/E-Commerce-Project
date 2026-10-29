/**
 * PdfLayoutContext
 *
 * SOLID — Single Responsibility: manages and propagates container layout constraints (width).
 * GoF   — Context / Chain of Responsibility: child primitives consume constraints from the nearest ancestor.
 */
import React, { createContext, useContext } from "react";

interface PdfLayoutContextType {
  availableWidth: number;
}

const PdfLayoutContext = createContext<PdfLayoutContextType | null>(null);

interface PdfLayoutProviderProps {
  availableWidth: number;
  children: React.ReactNode;
}

export const PdfLayoutProvider: React.FC<PdfLayoutProviderProps> = ({
  availableWidth,
  children,
}) => {
  return (
    <PdfLayoutContext.Provider value={{ availableWidth }}>
      {children}
    </PdfLayoutContext.Provider>
  );
};

export const usePdfLayout = () => {
  const context = useContext(PdfLayoutContext);
  return context;
};
