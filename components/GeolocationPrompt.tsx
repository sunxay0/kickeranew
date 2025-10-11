import React from 'react';
import { LoadingSpinner, LocationMarkerIcon } from './icons';

type GeolocationState = 'initial' | 'prompting' | 'loading' | 'granted' | 'denied';

interface GeolocationPromptProps {
  status: GeolocationState;
  onAllow: () => void;
  onSkip: () => void;
}

export const GeolocationPrompt: React.FC<GeolocationPromptProps> = ({ status, onAllow, onSkip }) => {
  let content;

  if (status === 'loading' || status === 'initial') {
    content = (
      <>
        <LoadingSpinner />
        <p className="mt-4 text-lg">Getting your location...</p>
      </>
    );
  } else if (status === 'denied') {
    content = (
      <>
        <LocationMarkerIcon />
        <h1 className="text-2xl font-bold mt-4">Location Access Denied</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-sm text-center">
          To find nearby fields, please enable location permissions for this site in your browser settings.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4 w-full max-w-xs">
          {/* FIX: Pass event handlers directly to simplify the prop chain. */}
          {/* Fix: Wrapped event handlers in arrow functions to match onClick prop type. */}
          {/* Fix: Removed wrapper arrow function to pass handler directly. */}
          <button onClick={onAllow} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition">
            Try Again
          </button>
          {/* FIX: Pass event handlers directly to simplify the prop chain. */}
          {/* Fix: Wrapped event handlers in arrow functions to match onClick prop type. */}
          {/* Fix: Removed wrapper arrow function to pass handler directly. */}
          <button onClick={onSkip} className="w-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-bold py-3 px-4 rounded-lg transition">
            Use Default Location
          </button>
        </div>
      </>
    );
  } else { // Prompting
    content = (
      <>
        <LocationMarkerIcon />
        <h1 className="text-2xl font-bold mt-4">Find Fields Near You</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-sm text-center">
          Enable location services to discover football fields in your area.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4 w-full max-w-xs">
          {/* FIX: Pass event handlers directly to simplify the prop chain. */}
          {/* Fix: Wrapped event handlers in arrow functions to match onClick prop type. */}
          {/* Fix: Removed wrapper arrow function to pass handler directly. */}
          <button onClick={onAllow} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition">
            Allow Access
          </button>
          {/* FIX: Pass event handlers directly to simplify the prop chain. */}
          {/* Fix: Wrapped event handlers in arrow functions to match onClick prop type. */}
          {/* Fix: Removed wrapper arrow function to pass handler directly. */}
          <button onClick={onSkip} className="w-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-bold py-3 px-4 rounded-lg transition">
            Continue without Location
          </button>
        </div>
      </>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center p-4">
      {content}
    </div>
  );
};