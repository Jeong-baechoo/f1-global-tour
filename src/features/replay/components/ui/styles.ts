import { CSSProperties } from 'react';

export const glassPanelStyle: CSSProperties = {
  backgroundColor: 'rgba(18, 18, 20, 0.65)',
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.05)',
  filter: 'drop-shadow(0 30px 60px rgba(0,0,0,0.3)) drop-shadow(0 15px 30px rgba(0,0,0,0.2))',
};
