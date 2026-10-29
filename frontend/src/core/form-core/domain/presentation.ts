export interface PresentationDefinition {
  theme?: "light" | "dark" | "system" | string;
  tokens?: {
    primaryColor?: string;
    backgroundColor?: string;
    borderRadius?: string;
    fontFamily?: string;
    densitySpacing?: string;
  };
  style?: {
    primaryColor?: string;
    backgroundColor?: string;
    borderRadius?: string;
    fontFamily?: string;
    customClasses?: string;
    classNames?: {
      shell?: string;
      atmosphere?: string;
      root?: string;
      header?: string;
      title?: string;
      description?: string;
      body?: string;
      footer?: string;
      actionContainer?: string;
      submitButton?: string;
      cancelButton?: string;
      [key: string]: string | undefined;
    };
  };
  animations?: {
    transitionDuration?: string;
    enterAnimation?: string;
  };
}
