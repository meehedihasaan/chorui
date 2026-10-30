type LikeGlyphProps = {
  className?: string;
};

/**
 * Chorui's own flat thumbs-up, drawn for the Like reaction.
 * A single silhouette: raised thumb, folded fingers, wrist.
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
      <path
        d='M21.6 11.0c0-1.2-1.0-2.2-2.2-2.2h-5.4l0.9-4.3c0.07-0.3 0.1-0.6 0.1-0.9 0-1.9-1.5-3.4-3.4-3.4-0.8 0-1.6 0.3-2.2 0.8L4.8 5.1c-0.6 0.5-0.9 1.3-0.9 2.1v10.0c0 1.2 1.0 2.2 2.2 2.2h9.0c0.9 0 1.7-0.6 2.0-1.4l3.4-7.6c0.1-0.2 0.1-0.5 0.1-0.7z'
        transform='translate(-0.3 2.2)'
      />
    </svg>
  );
}
