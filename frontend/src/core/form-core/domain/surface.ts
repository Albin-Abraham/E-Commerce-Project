export interface UIScreenSurface {
  target: "screen";
  density?: "compact" | "comfortable" | "spacious";
  width?: "full" | "contained" | "centered";
  maxHeight?: string;
  stickyHeader?: boolean;
  stickyFooter?: boolean;
  shell?: any[];
  containers?: any[];
  wizard?: {
    enabled: boolean;
    stepperType?: "sidebar" | "top";
    linear?: boolean;
  };
}

export interface PrintSurface {
  target: "print";
  paper?: "A4" | "A3" | "Letter" | "Legal";
  orientation?: "portrait" | "landscape";
  margins?: { top?: string; bottom?: string; left?: string; right?: string };
  header?: string;
  footer?: string;
  repeatHeaders?: boolean;
  pageBreaks?: string[];
  hideFields?: string[];
}

export interface PDFSurface {
  target: "pdf";
  watermark?: string;
  footerTemplate?: string;
  headerTemplate?: string;
  signatureBlocks?: string[];
}

export interface MobileSurface {
  target: "mobile";
  bottomSheet?: boolean;
  swipeToDismiss?: boolean;
  nativeInputs?: boolean;
  compactCards?: boolean;
}

export type SurfaceDefinition =
  | UIScreenSurface
  | PrintSurface
  | PDFSurface
  | MobileSurface;
