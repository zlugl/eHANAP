import React from 'react';

export interface DemoPersonaPillProps {
  currentRole?: string;
  className?: string;
}

// Clean-slate production mode: demo persona switcher is hidden
export const DemoPersonaPill: React.FC<DemoPersonaPillProps> = () => {
  return null;
};
