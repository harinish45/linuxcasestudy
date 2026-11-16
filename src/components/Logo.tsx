/**
 * Linux Lab brand mark — a flat terracotta tile carrying a terminal prompt
 * with a blinking-cursor block. A deliberate departure from the previous
 * three-bar mark; gradient-free so it renders identically in both themes.
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
      {/* terminal prompt "> " carved from the tile */}
      <path
        d="M8 10.4 L14.2 16 L8 21.6"
        stroke="#faf9f5"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* cursor block */}
      <rect x="17.5" y="18.6" width="7" height="3.4" rx="1.7" fill="#faf9f5" opacity="0.85" />
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
