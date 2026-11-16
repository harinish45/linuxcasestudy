/**
 * Linux Lab brand mark — a flat terracotta tile carrying three stacked
 * layers: storage (LVM) → share (NFS) → ship (containers). Deliberately
 * gradient-free so it renders identically in light and dark themes.
 */
export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
      className={className}
      focusable="false"
    >
      <rect x="1.5" y="1.5" width="29" height="29" rx="8" fill="#d97757" />
      {/* three stacked layers — top / middle (offset) / bottom */}
      <rect x="7.5" y="7.6" width="17" height="3.6" rx="1.8" fill="#faf9f5" />
      <rect x="11" y="13.9" width="10.5" height="3.6" rx="1.8" fill="#faf9f5" opacity="0.92" />
      <rect x="7.5" y="20.2" width="17" height="3.6" rx="1.8" fill="#faf9f5" opacity="0.8" />
    </svg>
  );
}

/** Mark + wordmark, used in the sidebar and footer. */
export function LogoLockup({ size = 30 }: { size?: number }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark size={size} />
      <span className="flex flex-col">
        <span className="display text-[16.5px] leading-tight text-foreground">Linux Lab</span>
        <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-text-faint">
          learn · practise · master
        </span>
      </span>
    </span>
  );
}
