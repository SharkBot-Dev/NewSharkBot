import React from 'react';

interface ToggleSwitchProps {
  isEnabled: boolean;
  isProcessing?: boolean;
  onToggle: () => void;
  disabled?: boolean;
  activeColor?: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  isEnabled,
  isProcessing = false,
  onToggle,
  disabled = false,
  activeColor = 'bg-indigo-600'
}) => {
  return (
    <div className="relative z-20 flex items-center">
      <button
        type="button"
        disabled={disabled || isProcessing}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
          isProcessing ? "opacity-50 cursor-wait" : "cursor-pointer"
        } ${
          isEnabled
            ? activeColor
            : "bg-slate-200 dark:bg-slate-700"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        {isProcessing && (
          <span className="absolute inset-0 flex items-center justify-center">
            <svg
              className="animate-spin h-3 w-3 text-white"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </span>
        )}

        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${
            isEnabled ? "translate-x-6" : "translate-x-1"
          } ${isProcessing ? "opacity-0" : "opacity-100"}`}
        />
      </button>
    </div>
  );
};

export default ToggleSwitch;