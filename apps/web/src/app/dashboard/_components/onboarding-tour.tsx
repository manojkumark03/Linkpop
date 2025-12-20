'use client';

import * as React from 'react';
import Joyride, { type CallBackProps, STATUS, type Step } from 'react-joyride';

const STORAGE_KEY = 'acme:onboarding:dashboard:v1';

const steps: Step[] = [
  {
    target: '#dashboard-header',
    title: 'Welcome to your dashboard',
    content: 'This is where you manage your profile and links.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="stats"]',
    title: 'Quick stats',
    content: 'Track total clicks, recent activity, and link count at a glance.',
  },
  {
    target: '[data-tour="profile-editor"]',
    title: 'Profile editor',
    content: 'Update your profile and links here.',
  },
];

export function DashboardOnboardingTour() {
  const [run, setRun] = React.useState(false);

  React.useEffect(() => {
    try {
      const done = window.localStorage.getItem(STORAGE_KEY);
      if (!done) setRun(true);
    } catch {
      // ignore
    }
  }, []);

  const handleCallback = React.useCallback((data: CallBackProps) => {
    const finished = data.status === STATUS.FINISHED || data.status === STATUS.SKIPPED;
    if (!finished) return;

    try {
      window.localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // ignore
    }

    setRun(false);
  }, []);

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showSkipButton
      showProgress
      callback={handleCallback}
      styles={{
        options: {
          zIndex: 200,
        },
      }}
    />
  );
}
