import * as React from "react";
import { ArrowRight, Search, SlidersHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";

export type DetectorCategoryId =
  | "All"
  | "Assertions"
  | "Structure & Clarity"
  | "Logic & Flow"
  | "Flakiness & Isolation";

export interface DetectorCategoryTab {
  id: DetectorCategoryId;
  desktopLabel: string;
  mobileLabel: string;
  desktopWidth?: number;
}

export interface DetectorItem {
  order: number;
  name: string;
  category: Exclude<DetectorCategoryId, "All">;
  categoryVariant: "accent" | "chestnut" | "warn" | "ok";
  description: string;
  trigger: string;
  threshold?: string;
  featured: boolean;
  mobileFeatured: boolean;
  chipRow?: number;
}

export interface DetectorsCatalogProps {
  categories: DetectorCategoryTab[];
  searchPlaceholder: string;
  moreHeaderLabel: string;
  viewAllLabel: string;
  mobileMoreLabel: string;
  detectors: DetectorItem[];
}

const categoryBadgeStyles: Record<DetectorItem["categoryVariant"], string> = {
  warn: "bg-snuts-warn-14 text-snuts-warn",
  accent: "bg-snuts-accent-14 text-snuts-text",
  chestnut: "bg-snuts-chestnut-10 text-snuts-text",
  ok: "bg-snuts-ok-12 text-snuts-ok",
};

export function DetectorsCatalog({
  categories,
  searchPlaceholder,
  moreHeaderLabel,
  viewAllLabel,
  mobileMoreLabel,
  detectors,
}: DetectorsCatalogProps): React.ReactElement {
  const [selectedCategory, setSelectedCategory] = React.useState<DetectorCategoryId>("All");
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [showAllDesktop, setShowAllDesktop] = React.useState<boolean>(false);
  const [showAllMobile, setShowAllMobile] = React.useState<boolean>(false);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const isFiltered = selectedCategory !== "All" || normalizedQuery.length > 0;

  const filteredDetectors = React.useMemo((): DetectorItem[] => {
    return detectors.filter((detector): boolean => {
      const matchesCategory =
        selectedCategory === "All" || detector.category === selectedCategory;
      if (!matchesCategory) {
        return false;
      }
      if (!normalizedQuery) {
        return true;
      }
      return (
        detector.name.toLowerCase().includes(normalizedQuery) ||
        detector.description.toLowerCase().includes(normalizedQuery) ||
        detector.trigger.toLowerCase().includes(normalizedQuery) ||
        detector.category.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [detectors, selectedCategory, normalizedQuery]);

  const desktopCardDetectors = React.useMemo((): DetectorItem[] => {
    if (isFiltered || showAllDesktop) {
      return filteredDetectors;
    }
    return filteredDetectors.filter((d): boolean => d.featured);
  }, [filteredDetectors, isFiltered, showAllDesktop]);

  const desktopChipRows = React.useMemo((): DetectorItem[][] => {
    const chips = detectors.filter((d): boolean => !d.featured);
    return [
      chips.filter((d): boolean => d.chipRow === 1),
      chips.filter((d): boolean => d.chipRow === 2),
      chips.filter((d): boolean => d.chipRow === 3),
    ];
  }, [detectors]);

  const mobileCardDetectors = React.useMemo((): DetectorItem[] => {
    if (selectedCategory !== "All" || showAllMobile) {
      return filteredDetectors;
    }
    return filteredDetectors.filter((d): boolean => d.mobileFeatured);
  }, [filteredDetectors, selectedCategory, showAllMobile]);

  return (
    <>
      {/* Desktop Catalog (HRgjU / Bx2G3 + J9CMbC + f9w6L) */}
      <div className="hidden lg:flex lg:flex-col lg:gap-[34px]">
        <div className="flex w-full items-center gap-[10px]">
          {categories.map((cat): React.ReactElement => {
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={(): void => setSelectedCategory(cat.id)}
                className={cn(
                  "inline-flex items-center justify-center rounded-pill px-[16px] py-[9px] font-body transition-colors",
                  cat.desktopWidth ? "text-[13px]" : "text-[13.5px]",
                  active
                    ? "bg-snuts-accent font-semibold text-[#261B1F]"
                    : "border border-snuts-border bg-snuts-card font-medium text-snuts-muted hover:bg-snuts-card-hover hover:text-snuts-text",
                )}
              >
                {cat.desktopLabel}
              </button>
            );
          })}
          <div className="flex-1" />
          <div className="flex w-[268px] items-center gap-[9px] rounded-[10px] border border-snuts-border bg-snuts-well px-[15px] py-[10px]">
            <Search className="h-[15px] w-[15px] shrink-0 text-snuts-meta" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e): void => setSearchQuery(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="w-full bg-transparent font-body text-[13.5px] text-snuts-text placeholder:text-snuts-muted focus:outline-none"
            />
          </div>
        </div>

        <div className="grid w-full grid-cols-3 gap-[24px]">
          {desktopCardDetectors.map(
            (detector): React.ReactElement => (
              <div
                key={detector.order}
                className="flex h-[176px] flex-col justify-between gap-[12px] rounded-[16px] border border-snuts-border bg-snuts-card p-[20px] transition-colors hover:bg-snuts-card-hover"
              >
                <div className="flex flex-col gap-[12px]">
                  <div className="flex w-full items-center justify-between gap-[10px]">
                    <h3 className="font-display text-[17px] font-semibold tracking-[-0.2px] text-snuts-heading">
                      {detector.name}
                    </h3>
                    <span
                      className={cn(
                        "inline-flex shrink-0 items-center rounded-pill px-[10px] py-[4px] font-body text-[11px] font-semibold",
                        categoryBadgeStyles[detector.categoryVariant],
                      )}
                    >
                      {detector.category}
                    </span>
                  </div>
                  <p className="font-body text-[13px] font-normal leading-[1.5] text-snuts-muted">
                    {detector.description}
                  </p>
                </div>

                <div className="flex w-full items-center justify-between gap-[8px]">
                  <span className="inline-flex items-center rounded-[8px] border border-snuts-border bg-snuts-well px-[10px] py-[6px] font-mono text-[11px] text-snuts-text">
                    {detector.trigger}
                  </span>
                  {detector.threshold ? (
                    <span className="inline-flex items-center gap-[5px] rounded-pill bg-snuts-warn-14 px-[10px] py-[6px] font-mono text-[10.5px] text-snuts-warn">
                      <SlidersHorizontal className="h-[11px] w-[11px] text-snuts-warn" />
                      <span>{detector.threshold}</span>
                    </span>
                  ) : null}
                </div>
              </div>
            ),
          )}
        </div>

        {!isFiltered && (
          <div className="flex w-full flex-col gap-[16px] rounded-[16px] border border-snuts-border bg-snuts-espresso p-[22px]">
            <div className="flex w-full items-center justify-between gap-[8px]">
              <div className="flex items-center gap-[9px]">
                <span className="h-[7px] w-[7px] rounded-full bg-snuts-accent" />
                <span className="font-mono text-[12.5px] font-medium text-snuts-accent-hover">
                  {moreHeaderLabel}
                </span>
              </div>
              <div className="flex-1" />
              <button
                type="button"
                onClick={(): void => setShowAllDesktop(!showAllDesktop)}
                className="inline-flex items-center gap-[7px] font-body text-[13.5px] font-semibold text-snuts-text transition-colors hover:text-snuts-accent-hover"
              >
                <span>{showAllDesktop ? "Show featured 12 detectors" : viewAllLabel}</span>
                <ArrowRight className="h-[15px] w-[15px] text-snuts-accent" />
              </button>
            </div>

            {desktopChipRows.map(
              (row, rowIdx): React.ReactElement => (
                <div key={rowIdx} className="flex w-full flex-wrap items-center gap-[8px]">
                  {row.map(
                    (chip): React.ReactElement => (
                      <button
                        key={chip.order}
                        type="button"
                        onClick={(): void => setShowAllDesktop(true)}
                        className="inline-flex items-center rounded-pill border border-snuts-border bg-snuts-card px-[13px] py-[7px] font-body text-[11.5px] font-normal text-snuts-muted transition-colors hover:bg-snuts-card-hover hover:text-snuts-text"
                      >
                        {chip.name}
                      </button>
                    ),
                  )}
                </div>
              ),
            )}
          </div>
        )}
      </div>

      {/* Mobile Catalog (KpfL5 / cmoaK + cards + o5N4w) */}
      <div className="flex w-full flex-col gap-[20px] lg:hidden">
        <div className="no-scrollbar flex h-[48px] w-full items-center gap-[8px] overflow-x-auto">
          {categories.map((cat): React.ReactElement => {
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={(): void => setSelectedCategory(cat.id)}
                className={cn(
                  "inline-flex h-[44px] shrink-0 items-center justify-center rounded-pill px-[14px] py-[9px] font-body text-[12px] transition-colors",
                  active
                    ? "bg-snuts-accent font-semibold text-[#261B1F]"
                    : "border border-snuts-border bg-snuts-card font-medium text-snuts-muted",
                )}
              >
                {cat.mobileLabel}
              </button>
            );
          })}
        </div>

        <div className="flex w-full flex-col gap-[20px]">
          {mobileCardDetectors.map(
            (detector): React.ReactElement => (
              <div
                key={detector.order}
                className="flex w-full flex-col gap-[10px] rounded-[14px] border border-snuts-border bg-snuts-card p-[16px]"
              >
                <div className="flex w-full items-center justify-between gap-[8px]">
                  <h3 className="font-display text-[15.5px] font-semibold tracking-[-0.2px] text-snuts-heading">
                    {detector.name}
                  </h3>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-pill px-[9px] py-[4px] font-body text-[11px] font-semibold",
                      categoryBadgeStyles[detector.categoryVariant],
                    )}
                  >
                    {detector.category}
                  </span>
                </div>
                <div className="flex w-full items-center gap-[8px]">
                  <span className="inline-flex items-center rounded-[7px] border border-snuts-border bg-snuts-well px-[9px] py-[5px] font-mono text-[10.5px] text-snuts-text">
                    {detector.trigger}
                  </span>
                </div>
              </div>
            ),
          )}

          {selectedCategory === "All" && (
            <button
              type="button"
              onClick={(): void => setShowAllMobile(!showAllMobile)}
              className="flex w-full items-center gap-[8px] rounded-[12px] border border-snuts-border bg-snuts-espresso px-[15px] py-[12px] text-left"
            >
              <span className="font-body text-[12.5px] font-normal text-snuts-text">
                {showAllMobile ? "Show compact 4 detectors" : mobileMoreLabel}
              </span>
              <div className="flex-1" />
              <ArrowRight className="h-[15px] w-[15px] text-snuts-accent" />
            </button>
          )}
        </div>
      </div>
    </>
  );
}
