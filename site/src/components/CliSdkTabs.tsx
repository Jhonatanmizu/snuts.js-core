import * as React from "react";
import { Braces, Package, ShieldCheck, Terminal } from "lucide-react";

import { cn } from "@/lib/utils";

export interface CliSdkCommand {
  comment: string;
  prefix: string;
  pkg: string;
  args: string;
  mobileFullCommand?: string;
}

export interface SdkCodeLine {
  text: string;
  color: "rose" | "text" | "ok" | "warn" | "accent-hover";
}

export interface ConfigCodeLine {
  text: string;
  color: "text" | "ok" | "warn";
}

export interface CliSdkTabItem {
  id: string;
  label: string;
  mobileWidth: number;
  commands: CliSdkCommand[];
  sdkLines: SdkCodeLine[];
  configLines: ConfigCodeLine[];
}

export interface CliSdkTabsProps {
  tabs: CliSdkTabItem[];
  desktopSafeNote: string;
  mobileSafeNote: string;
}

const sdkColorClasses: Record<SdkCodeLine["color"], string> = {
  rose: "text-snuts-rose",
  text: "text-snuts-text",
  ok: "text-snuts-ok",
  warn: "text-snuts-warn",
  "accent-hover": "text-snuts-accent-hover",
};

const configColorClasses: Record<ConfigCodeLine["color"], string> = {
  text: "text-snuts-text",
  ok: "text-snuts-ok",
  warn: "text-snuts-warn",
};

export function CliSdkTabs({
  tabs,
  desktopSafeNote,
  mobileSafeNote,
}: CliSdkTabsProps): React.ReactElement {
  const [activeId, setActiveId] = React.useState<string>(tabs[0]?.id ?? "analyze");

  const activeTab = React.useMemo((): CliSdkTabItem => {
    return tabs.find((t): boolean => t.id === activeId) ?? tabs[0]!;
  }, [tabs, activeId]);

  const mobileCommands = React.useMemo((): CliSdkCommand[] => {
    return activeTab.commands.filter((cmd): boolean => Boolean(cmd.mobileFullCommand));
  }, [activeTab]);

  return (
    <>
      {/* Desktop Code Card (HRgjU / gnTLX) */}
      <div className="hidden w-full flex-col overflow-hidden rounded-[16px] border border-snuts-border bg-snuts-espresso lg:flex">
        <div
          className="flex w-full items-end gap-[26px] bg-snuts-espresso px-[22px] py-[15px]"
          role="tablist"
        >
          {tabs.map((tab): React.ReactElement => {
            const isActive = tab.id === activeTab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={(): void => setActiveId(tab.id)}
                className="flex flex-1 flex-col items-start gap-[11px] text-left focus:outline-none"
              >
                <span
                  className={cn(
                    "font-mono text-[13px] transition-colors",
                    isActive
                      ? "font-medium text-snuts-accent-hover"
                      : "font-normal text-snuts-muted hover:text-snuts-text",
                  )}
                >
                  {tab.label}
                </span>
                <span
                  className={cn(
                    "h-[3px] w-full rounded-[2px] transition-colors",
                    isActive ? "bg-snuts-accent" : "bg-transparent",
                  )}
                />
              </button>
            );
          })}
        </div>

        <div className="h-[1px] w-full bg-snuts-border" />

        <div className="flex w-full items-stretch">
          {/* Terminal (720px) */}
          <div className="flex w-[640px] xl:w-[720px] shrink-0 flex-col gap-[14px] bg-snuts-well px-[22px] py-[20px]">
            <div className="flex w-full items-center gap-[9px]">
              <Terminal className="h-[14px] w-[14px] text-snuts-ok" />
              <span className="font-mono text-[11px] font-medium tracking-[1.4px] text-snuts-muted">
                TERMINAL
              </span>
              <div className="flex-1" />
              <span className="rounded-pill bg-snuts-accent-14 px-[9px] py-[3px] font-mono text-[10.5px] text-snuts-accent-hover">
                npx
              </span>
            </div>

            {activeTab.commands.map(
              (cmd, idx): React.ReactElement => (
                <div key={idx} className="flex w-full flex-col gap-[7px]">
                  <span className="font-mono text-[12.5px] font-normal text-snuts-muted">
                    {cmd.comment}
                  </span>
                  <div className="flex w-full items-center gap-[9px]">
                    <span className="font-mono text-[13px] text-snuts-ok">$</span>
                    <div className="flex items-center font-mono text-[12.5px] whitespace-pre">
                      <span className="text-snuts-rose">{cmd.prefix}</span>
                      <span className="text-snuts-accent">{cmd.pkg}</span>
                      <span className="text-snuts-text">{cmd.args}</span>
                    </div>
                  </div>
                </div>
              ),
            )}
          </div>

          {/* SDK Panel */}
          <div className="flex flex-1 flex-col gap-[16px] bg-snuts-card p-[20px]">
            <div className="flex w-full flex-col gap-[9px]">
              <div className="flex w-full items-center gap-[7px]">
                <Package className="h-[13px] w-[13px] text-snuts-accent" />
                <span className="font-mono text-[11px] font-medium tracking-[1.3px] text-snuts-accent-hover">
                  PROGRAMMATIC SDK
                </span>
              </div>
              <div className="flex w-full flex-col gap-[6px] rounded-[10px] border border-snuts-border bg-snuts-well p-[14px]">
                {activeTab.sdkLines.map(
                  (line, idx): React.ReactElement => (
                    <div
                      key={idx}
                      className={cn(
                        "min-h-[16px] font-mono text-[12px] whitespace-pre",
                        sdkColorClasses[line.color],
                      )}
                    >
                      {line.text}
                    </div>
                  ),
                )}
              </div>
            </div>

            <div className="flex w-full flex-col gap-[9px]">
              <div className="flex w-full items-center gap-[7px]">
                <Braces className="h-[13px] w-[13px] text-snuts-warn" />
                <span className="font-mono text-[11px] font-medium tracking-[1.3px] text-snuts-warn">
                  snuts.config.json
                </span>
              </div>
              <div className="flex w-full flex-col gap-[6px] rounded-[10px] border border-snuts-border bg-snuts-well p-[14px]">
                {activeTab.configLines.map(
                  (line, idx): React.ReactElement => (
                    <div
                      key={idx}
                      className={cn(
                        "font-mono text-[12px] whitespace-pre",
                        configColorClasses[line.color],
                      )}
                    >
                      {line.text}
                    </div>
                  ),
                )}
              </div>
            </div>

            <div className="flex w-full items-start gap-[8px] rounded-[10px] bg-snuts-accent-14 px-[13px] py-[11px]">
              <ShieldCheck className="mt-0.5 h-[14px] w-[14px] shrink-0 text-snuts-accent" />
              <span className="font-body text-[12.5px] font-normal leading-[1.5] text-snuts-text">
                {desktopSafeNote}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile CLI & SDK (KpfL5 / DQoIG + M1USX + D7RTP4) */}
      <div className="flex w-full flex-col gap-[18px] lg:hidden">
        <div
          className="no-scrollbar flex h-[48px] w-full items-center gap-[18px] overflow-x-auto"
          role="tablist"
        >
          {tabs.map((tab): React.ReactElement => {
            const isActive = tab.id === activeTab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={(): void => setActiveId(tab.id)}
                className="flex h-[44px] shrink-0 flex-col justify-center gap-[8px] text-left focus:outline-none"
              >
                <span
                  className={cn(
                    "font-mono text-[11px]",
                    isActive ? "text-snuts-accent-hover" : "text-snuts-muted",
                  )}
                >
                  {tab.label}
                </span>
                <span
                  className={cn(
                    "h-[2px] w-full rounded-[1px]",
                    isActive ? "bg-snuts-accent" : "bg-transparent",
                  )}
                />
              </button>
            );
          })}
        </div>

        {/* Mobile Terminal */}
        <div className="flex w-full flex-col gap-[13px] overflow-hidden rounded-[12px] border border-snuts-border bg-snuts-well px-[14px] py-[15px]">
          <div className="flex w-full items-center gap-[8px]">
            <Terminal className="h-[13px] w-[13px] text-snuts-ok" />
            <span className="font-mono text-[11px] font-medium tracking-[1.2px] text-snuts-muted">
              TERMINAL
            </span>
            <div className="flex-1" />
            <span className="rounded-pill bg-snuts-accent-14 px-[8px] py-[3px] font-mono text-[11px] text-snuts-accent-hover">
              npx
            </span>
          </div>

          {mobileCommands.map(
            (cmd, idx): React.ReactElement => (
              <div key={idx} className="flex w-full flex-col gap-[6px]">
                <span className="font-mono text-[10px] text-snuts-muted">
                  {cmd.comment.replace("JSON/CSV reports", "JSON")}
                </span>
                <div className="flex w-full items-center gap-[7px]">
                  <span className="font-mono text-[11px] text-snuts-ok">$</span>
                  <span className="font-mono text-[10.5px] text-snuts-text">
                    {cmd.mobileFullCommand}
                  </span>
                </div>
              </div>
            ),
          )}
        </div>

        {/* Mobile SDK Panel */}
        <div className="flex w-full flex-col gap-[11px] rounded-[12px] border border-snuts-border bg-snuts-card px-[14px] py-[15px]">
          <div className="flex w-full items-center gap-[7px]">
            <Braces className="h-[13px] w-[13px] text-snuts-warn" />
            <span className="font-mono text-[10.5px] font-medium text-snuts-warn">
              snuts.config.json
            </span>
          </div>
          <div className="flex w-full flex-col gap-[6px] rounded-[9px] border border-snuts-border bg-snuts-well p-[12px]">
            {activeTab.configLines.map(
              (line, idx): React.ReactElement => (
                <div
                  key={idx}
                  className={cn(
                    "font-mono text-[10.5px] whitespace-pre",
                    configColorClasses[line.color],
                  )}
                >
                  {line.text}
                </div>
              ),
            )}
          </div>
          <div className="flex w-full items-center gap-[7px] rounded-[9px] bg-snuts-accent-14 px-[11px] py-[9px]">
            <ShieldCheck className="h-[12px] w-[12px] shrink-0 text-snuts-accent" />
            <span className="font-body text-[11.5px] font-normal leading-[1.5] text-snuts-text">
              {mobileSafeNote}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
