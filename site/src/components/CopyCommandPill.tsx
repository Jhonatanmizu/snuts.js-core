import * as React from "react";
import { Check, Copy } from "lucide-react";

import { cn } from "@/lib/utils";

export interface CopyCommandPillProps {
  command: string;
  chip?: string;
  variant?: "hero" | "cta-desktop";
  prefixToken?: string;
  pkgToken?: string;
  argsToken?: string;
}

export function CopyCommandPill({
  command,
  chip,
  variant = "hero",
  prefixToken,
  pkgToken,
  argsToken,
}: CopyCommandPillProps): React.ReactElement {
  const [copied, setCopied] = React.useState<boolean>(false);

  const handleCopy = async (): Promise<void> => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      window.setTimeout((): void => {
        setCopied(false);
      }, 2000);
    }
  };

  if (variant === "cta-desktop") {
    return (
      <div className="flex w-full max-w-[600px] items-center gap-[12px] rounded-[12px] border border-snuts-border bg-snuts-well px-[18px] py-[14px]">
        <span className="font-mono text-[13.5px] font-medium text-snuts-ok">$</span>
        <div className="flex items-center font-mono text-[13.5px] whitespace-pre">
          {prefixToken ? (
            <>
              <span className="text-snuts-rose">{prefixToken}</span>
              <span className="font-medium text-snuts-accent">{pkgToken}</span>
              <span className="text-snuts-text">{argsToken}</span>
            </>
          ) : (
            <span className="text-snuts-text">{command}</span>
          )}
        </div>
        <div className="flex-1" />
        <button
          type="button"
          onClick={(): void => {
            void handleCopy();
          }}
          className="inline-flex items-center gap-[6px] rounded-[8px] bg-snuts-card px-[10px] py-[5px] font-body text-[11.5px] font-medium text-snuts-muted transition-colors hover:bg-snuts-card-hover hover:text-snuts-text"
        >
          {copied ? (
            <>
              <Check className="h-[12px] w-[12px] text-snuts-ok" />
              <span className="text-snuts-ok">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-[12px] w-[12px] text-snuts-meta" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex w-full items-center gap-[11px] rounded-[10px] border border-snuts-border bg-snuts-well px-[15px] py-[13px]",
      )}
    >
      <span className="font-mono text-[14px] text-snuts-muted">$</span>
      <span className="font-mono text-[14px] text-snuts-text">{command}</span>
      {chip ? (
        <span className="inline-flex items-center rounded-pill bg-snuts-accent-14 px-[9px] py-[3px] font-mono text-[11px] text-snuts-accent-hover">
          {chip}
        </span>
      ) : null}
      <div className="flex-1" />
      <button
        type="button"
        onClick={(): void => {
          void handleCopy();
        }}
        className="inline-flex items-center gap-[6px] rounded-[8px] bg-snuts-card px-[13px] py-[8px] font-body text-[12.5px] font-medium text-snuts-muted transition-colors hover:bg-snuts-card-hover hover:text-snuts-text"
      >
        {copied ? (
          <>
            <Check className="h-[13px] w-[13px] text-snuts-ok" />
            <span className="text-snuts-ok">Copied</span>
          </>
        ) : (
          <>
            <Copy className="h-[13px] w-[13px] text-snuts-muted" />
            <span>Copy</span>
          </>
        )}
      </button>
    </div>
  );
}
