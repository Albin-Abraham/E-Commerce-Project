import React from "react";

interface ZenithHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string | number;
  actions?: React.ReactNode;
  tabs?: React.ReactNode;
  utility?: React.ReactNode;
}

export const ZenithHeader = ({
  title,
  subtitle,
  badge,
  actions,
  tabs,
  utility,
}: ZenithHeaderProps) => {
  return (
    <header className="p-8 border-b border-border/40 bg-white dark:bg-surface shrink-0">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-black tracking-tight text-foreground">
              {title}
            </h1>
            {badge && (
              <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-black">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-muted-foreground text-sm">{subtitle}</p>
          )}
        </div>

        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>

      <div className="flex items-center justify-between">
        {tabs && (
          <div className="flex items-center gap-1 bg-muted/20 p-1 rounded-xl border border-border/20">
            {tabs}
          </div>
        )}

        {utility && <div className="flex items-center gap-4">{utility}</div>}
      </div>
    </header>
  );
};

ZenithHeader.Tab = function ZenithHeaderTab({
  children,
  active,
  icon: Icon,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  icon?: any;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold transition-all
        ${active ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}
      `}
    >
      {Icon && <Icon size={14} />}
      {children}
    </button>
  );
};
