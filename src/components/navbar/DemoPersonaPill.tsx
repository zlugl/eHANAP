import React from 'react';

export interface DemoPersonaPillProps {
  currentRole?: string;
  onSwitchRole: (role: 'job_seeker' | 'employer' | 'admin') => void;
  className?: string;
}

// Clean-slate production mode: demo persona switcher is hidden
export const DemoPersonaPill: React.FC<DemoPersonaPillProps> = () => {
  return null;
};
