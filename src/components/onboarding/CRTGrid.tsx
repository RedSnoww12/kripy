import { T } from './tokens';

export default function CRTGrid() {
  return (
    <svg
      width="100%"
      height="100%"
      style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.35,
        pointerEvents: 'none',
      }}
      aria-hidden
    >
      <defs>
        <pattern
          id="onb-grid"
          width="28"
          height="28"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M28 0H0V28"
            fill="none"
            stroke={T.outline}
            strokeWidth=".5"
          />
        </pattern>
        <radialGradient id="onb-vignette" cx="50%" cy="40%" r="70%">
          <stop offset="0%" stopColor="transparent" />
          <stop offset="100%" stopColor={T.bg} />
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#onb-grid)" />
      <rect width="100%" height="100%" fill="url(#onb-vignette)" />
    </svg>
  );
}
