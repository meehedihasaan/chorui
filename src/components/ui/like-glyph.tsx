type LikeGlyphProps = {
  className?: string;
};

/**
 * Chorui's own flat thumbs-up, drawn for the Like reaction.
 * Uses currentColor so it inherits the Like button's text colour.
 */
export function LikeGlyph({ className }: LikeGlyphProps): JSX.Element {
  return (
    <svg
      aria-hidden
      className={className ?? 'h-5 w-5'}
      fill='currentColor'
      viewBox='0 0 24 24'
      xmlns='http://www.w3.org/2000/svg'
    >
      {/* wrist cuff */}
      <rect height='11.2' rx='1.7' width='5.1' x='2.2' y='10.4' />
      {/* palm and folded fingers */}
      <rect height='10.5' rx='2.7' width='12.6' x='9' y='11.1' />
      {/* raised thumb */}
      <path d='M12.1 2.2c1.85-.45 3.35 1.05 3.35 2.95v4.3c0 1.65-1.15 2.95-2.75 3.05h-1.3c-1.5 0-2.65-1.2-2.65-2.7V6.0c0-1.9 1.3-3.45 3.35-3.8Z' />
    </svg>
  );
}
