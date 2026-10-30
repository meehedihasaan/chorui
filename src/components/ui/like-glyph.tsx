type LikeGlyphProps = {
  className?: string;
};

/**
 * Chorui's own flat thumbs-up, drawn for the Like reaction.
 * Built from overlapping rounded shapes so it stays chunky and readable
 * at reaction-row sizes. Uses currentColor to inherit the button's text colour.
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
      {/* fist */}
      <rect height='11.9' rx='3.2' width='13' x='7.6' y='9.6' />
      {/* raised thumb, leaning slightly outward */}
      <rect
        height='10.6'
        rx='2.6'
        transform='rotate(-8 11.8 7.4)'
        width='5.2'
        x='9.2'
        y='2.2'
      />
      {/* knuckle where the thumb meets the fingers */}
      <circle cx='14.7' cy='10.4' r='2.1' />
    </svg>
  );
}
