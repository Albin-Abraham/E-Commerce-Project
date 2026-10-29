import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import { Filter, X } from "lucide-react";
import { cn } from "@core/libs/utils";
import { useTableFilterForm } from "../../mdap/TableFilterContext";
import { TableFilterBar } from "./TableFilterBar";

export interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export function FilterDrawer({ isOpen, onClose, className }: FilterDrawerProps) {
  const { t } = useTranslation("common/base");
  const filterForm = useTableFilterForm();

  if (!filterForm) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs"
          />

          {/* Drawer Sheet */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={cn(
              "fixed right-0 top-0 bottom-0 z-50 w-full sm:w-[360px]",
              "bg-card border-l border-border/40 shadow-2xl p-4 flex flex-col gap-4",
              className
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <div className="flex items-center gap-2 font-semibold text-sm text-foreground">
                <Filter size={16} className="text-primary" />
                <span>{t("filters.title", "Filters")}</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50"
              >
                <X size={16} />
              </button>
            </div>

            {/* Filter Content */}
            <div className="flex-1 overflow-y-auto pr-1">
              <TableFilterBar />
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-border/40 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium text-xs hover:bg-primary/90 transition-all shadow-xs"
              >
                {t("filters.apply", "Apply Filters")}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
