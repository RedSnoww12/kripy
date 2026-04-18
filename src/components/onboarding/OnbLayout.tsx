import type { ReactNode } from 'react';
import CRTGrid from './CRTGrid';

interface Props {
  header: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}

export default function OnbLayout({ header, footer, children }: Props) {
  return (
    <div
      style={{
        position: 'relative',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <CRTGrid />
      <div style={{ position: 'relative', zIndex: 2, flexShrink: 0 }}>
        {header}
      </div>
      <div
        className="kripy-scroll"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          position: 'relative',
          zIndex: 2,
          padding: '0 24px',
          scrollbarWidth: 'none',
        }}
      >
        {children}
      </div>
      {footer}
    </div>
  );
}
