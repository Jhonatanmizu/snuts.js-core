import * as React from "react";
import { ArrowRight, Menu, X } from "lucide-react";

import { GithubIcon } from "@/components/icons/GithubIcon";
import { Sheet } from "@/components/ui/sheet";

export interface NavLinkItem {
  label: string;
  href: string;
}

export interface MobileNavProps {
  brandName: string;
  mascotUrl: string;
  githubUrl: string;
  getStartedLabel: string;
  getStartedHref: string;
  navLinks: NavLinkItem[];
}

export function MobileNav({
  brandName,
  mascotUrl,
  githubUrl,
  getStartedLabel,
  getStartedHref,
  navLinks,
}: MobileNavProps): React.ReactElement {
  const [open, setOpen] = React.useState<boolean>(false);

  return (
    <>
      <div className="flex h-[64px] w-full items-center justify-between border-b border-snuts-border bg-snuts-canvas px-[20px] py-[14px] lg:hidden">
        <a href="#" className="flex items-center gap-[9px]">
          <div className="h-[32px] w-[32px] overflow-hidden rounded-[9px]">
            <img
              src={mascotUrl}
              alt={`${brandName} mascot`}
              className="h-full w-full object-contain"
            />
          </div>
          <span className="font-display text-[17px] font-bold tracking-[-0.4px] text-snuts-heading">
            {brandName}
          </span>
        </a>
        <div className="flex items-center gap-[9px]">
          <a
            href={githubUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub repository"
            className="flex h-[44px] w-[44px] items-center justify-center rounded-[10px] border border-snuts-border bg-snuts-card text-snuts-text transition-colors hover:bg-snuts-card-hover"
          >
            <GithubIcon className="h-[18px] w-[18px]" />
          </a>
          <button
            type="button"
            aria-label={open ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={open}
            onClick={(): void => setOpen(!open)}
            className="flex h-[44px] w-[44px] items-center justify-center rounded-[10px] border border-snuts-border bg-snuts-card text-snuts-text transition-colors hover:bg-snuts-card-hover"
          >
            {open ? <X className="h-[19px] w-[19px]" /> : <Menu className="h-[19px] w-[19px]" />}
          </button>
        </div>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <nav className="flex flex-col gap-3">
          {navLinks.map(
            (link): React.ReactElement => (
              <a
                key={link.href}
                href={link.href}
                onClick={(): void => setOpen(false)}
                className="rounded-[10px] px-3 py-2.5 font-body text-[15px] font-medium text-snuts-text transition-colors hover:bg-snuts-card"
              >
                {link.label}
              </a>
            ),
          )}
          <div className="mt-2 flex flex-col gap-2.5 border-t border-snuts-border pt-4">
            <a
              href={getStartedHref}
              onClick={(): void => setOpen(false)}
              className="flex h-[46px] w-full items-center justify-center gap-2 rounded-[10px] bg-snuts-accent font-body text-[14.5px] font-bold text-[#261B1F] transition-colors hover:bg-snuts-accent-hover"
            >
              <span>{getStartedLabel}</span>
              <ArrowRight className="h-[15px] w-[15px]" />
            </a>
          </div>
        </nav>
      </Sheet>
    </>
  );
}
