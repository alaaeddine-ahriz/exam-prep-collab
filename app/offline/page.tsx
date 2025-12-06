"use client";

import { Button, Icon } from "../components";

export default function OfflinePage() {
  return (
    <div className="flex min-h-dvh w-full flex-col items-center justify-center bg-background-light dark:bg-background-dark px-4">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-warning/20 flex items-center justify-center">
            <Icon name="cloud_off" size="xl" className="text-warning" />
          </div>
        </div>
        
        <h1 className="text-text-primary-light dark:text-text-primary-dark text-2xl font-bold mb-3">
          You&apos;re Offline
        </h1>
        
        <p className="text-text-secondary-light dark:text-text-secondary-dark text-base mb-8">
          It looks like you&apos;ve lost your internet connection. Some features may be unavailable until you&apos;re back online.
        </p>
        
        <Button
          variant="primary"
          onClick={() => window.location.reload()}
        >
          <Icon name="refresh" size="sm" />
          Try Again
        </Button>
      </div>
    </div>
  );
}

