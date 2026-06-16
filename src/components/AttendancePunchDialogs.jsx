import React from "react";
import {
  AlertTriangle,
  Building2,
  House,
  Loader2,
  MapPin,
  Check,
  X,
  ArrowRight,
} from "lucide-react";
import { useLockBodyScroll } from "../hooks/useLockBodyScroll";
import { cn } from "../utils/cn";
import { Card, CardContent } from "./ui/Card";
import Button from "./ui/Button";

// Enhanced Modal with better animations and backdrop
const ModalShell = ({ isOpen, onClose, children }) => {
  useLockBodyScroll(isOpen);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="animate-in slide-in-from-bottom-4 duration-300 w-full flex justify-center">
        {children}
      </div>
    </div>
  );
};

// Close button component for consistency
const CloseButton = ({ onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600 hover:scale-110 disabled:opacity-50"
    aria-label="Close dialog"
  >
    <X className="h-4 w-4" />
  </button>
);

export const LocationAccessDialog = ({
  isOpen,
  onRetry,
  onClose,
  isLoading = false,
  detailMessage = "",
}) => (
  <ModalShell isOpen={isOpen} onClose={isLoading ? () => {} : onClose}>
    <Card className="relative w-full max-w-md overflow-hidden border-0 shadow-2xl shadow-black/20">
      <CloseButton onClick={onClose} disabled={isLoading} />

      {/* Header with refined styling */}
      <div className="bg-gradient-to-br from-rose-50 via-amber-50/30 to-white px-6 pb-5 pt-7">
        <div className="flex items-start gap-4">
          <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-100 to-amber-100 shadow-inner">
            <AlertTriangle className="h-6 w-6 text-rose-500" />
          </div>
          <div className="space-y-1.5 pt-0.5">
            <h3 className="text-lg font-bold text-slate-900">
              Location Access Required
            </h3>
            <p className="text-sm leading-relaxed text-slate-600">
              Allow location access to confirm your attendance.
            </p>
          </div>
        </div>
      </div>

      <CardContent className="space-y-5 px-6 pb-6 pt-4">
        {/* Status message with clean design */}
        <div className="rounded-xl border border-amber-200/50 bg-amber-50/60 p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-full bg-amber-100/80 p-1.5">
              <MapPin className="h-3.5 w-3.5 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-900">
                Location Unavailable
              </p>
              <p className="text-sm leading-relaxed text-amber-800/80">
                {detailMessage ||
                  "Please enable GPS or browser location services."}
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col-reverse gap-2.5 sm:flex-row">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 justify-center border-slate-200 bg-white font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300"
          >
            Cancel
          </Button>
          <Button
            onClick={onRetry}
            disabled={isLoading}
            className="flex-1 justify-center bg-gradient-to-r from-rose-500 to-amber-500 font-medium text-white shadow-lg shadow-rose-500/20 hover:shadow-rose-500/30 hover:from-rose-600 hover:to-amber-600 transition-all duration-200"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <MapPin className="mr-2 h-4 w-4" />
                Enable Location
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  </ModalShell>
);

const workModeOptions = [
  {
    value: "work_from_office",
    label: "At Office",
    description: "Verify attendance within office premises",
    icon: Building2,
    color: "primary",
    gradient: "from-primary-500 to-primary-600",
    bgGradient: "from-primary-50 to-primary-100/30",
  },
  {
    value: "work_from_home",
    label: "Remote",
    description: "Mark attendance from any location",
    icon: House,
    color: "emerald",
    gradient: "from-emerald-500 to-emerald-600",
    bgGradient: "from-emerald-50 to-emerald-100/30",
  },
];

export const WorkModeDialog = ({
  isOpen,
  onClose,
  selectedMode,
  onSelect,
  onConfirm,
  isLoading = false,
  errorMessage = "",
}) => (
  <ModalShell isOpen={isOpen} onClose={isLoading ? () => {} : onClose}>
    <Card className="relative w-full max-w-xl overflow-hidden border-0 shadow-2xl shadow-black/20">
      <CloseButton onClick={onClose} disabled={isLoading} />

      {/* Clean header without step indicator */}
      <div className="bg-gradient-to-br from-slate-50 via-white to-slate-50/80 px-6 pb-5 pt-7">
        <div className="space-y-2">
          <h3 className="text-2xl font-bold tracking-tight text-slate-900">
            Where are you working?
          </h3>
          <p className="max-w-md text-sm leading-relaxed text-slate-500">
            Select your work mode to complete attendance.
          </p>
        </div>
      </div>

      <CardContent className="space-y-5 px-6 pb-6 pt-4">
        {/* Option cards with enhanced interaction */}
        <div className="grid gap-3 sm:grid-cols-2">
          {workModeOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedMode === option.value;

            return (
              <button
                key={option.value}
                type="button"
                data-selected={isSelected}
                className={cn(
                  "group relative rounded-xl border-2 bg-white p-5 text-left transition-all duration-200",
                  "hover:shadow-lg hover:-translate-y-1",
                  "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-400",
                  isSelected
                    ? cn(
                        `border-${option.color}-500`,
                        `ring-${option.color}-400`,
                        `shadow-xl shadow-${option.color}-100/50`,
                        `bg-gradient-to-br ${option.bgGradient}`,
                      )
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50",
                )}
                onClick={() => onSelect(option.value)}
              >
                {/* Selection indicator */}
                {isSelected && (
                  <div className="absolute -right-1.5 -top-1.5 rounded-full bg-primary-500 p-0.5 shadow-lg shadow-primary-200">
                    <Check className="h-3.5 w-3.5 text-white" />
                  </div>
                )}

                <div className="flex items-start gap-4">
                  <div
                    data-selected={isSelected}
                    className={cn(
                      "flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl transition-all duration-200",
                      isSelected
                        ? cn(
                            `bg-gradient-to-br ${option.gradient}`,
                            "shadow-lg shadow-primary-200",
                          )
                        : "bg-slate-100 group-hover:bg-slate-200",
                      isSelected ? "text-white" : `text-${option.color}-600`,
                    )}
                  >
                    <Icon className="h-5.5 w-5.5" />
                  </div>
                  <div className="flex-1 space-y-0.5 pt-0.5">
                    <p className="text-sm font-semibold text-slate-900">
                      {option.label}
                    </p>
                    <p className="text-xs leading-relaxed text-slate-500">
                      {option.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="flex items-start gap-2.5 rounded-xl border border-rose-200/60 bg-rose-50/70 px-4 py-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
            <p className="text-sm leading-relaxed text-rose-700">
              {errorMessage}
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col-reverse gap-2.5 sm:flex-row">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 justify-center border-slate-200 bg-white font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading || !selectedMode}
            className="flex-1 justify-center bg-gradient-to-r from-primary-600 to-primary-700 font-medium text-white shadow-lg shadow-primary-500/25 hover:shadow-primary-500/35 hover:from-primary-700 hover:to-primary-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  </ModalShell>
);
