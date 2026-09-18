import React from "react";
import { createPortal } from "react-dom";
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

// Portal-powered Modal centered on the entire screen
const ModalShell = ({ isOpen, onClose, children }) => {
  useLockBodyScroll(isOpen);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="animate-in zoom-in-95 duration-200 w-full max-w-lg flex justify-center">
        {children}
      </div>
    </div>,
    document.body
  );
};

// Close button component
const CloseButton = ({ onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="absolute right-4 top-4 rounded-full p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600 hover:scale-105 active:scale-95 disabled:opacity-50 z-10"
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
    <Card className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
      <CloseButton onClick={onClose} disabled={isLoading} />

      {/* Centered Header */}
      <div className="px-6 pt-7 pb-4 text-center">
        <div className="mx-auto mb-3 flex h-13 w-13 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 ring-8 ring-rose-50/50">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h3 className="text-xl font-bold tracking-tight text-slate-900">
          Location Access Required
        </h3>
        <p className="mt-1 text-sm text-slate-500 max-w-xs mx-auto">
          Please allow location access to verify and log your attendance.
        </p>
      </div>

      <CardContent className="space-y-5 px-6 pb-6 pt-2">
        {/* Status message */}
        <div className="rounded-xl border border-amber-200/60 bg-amber-50/70 p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-full bg-amber-100 p-1.5 shrink-0">
              <MapPin className="h-4 w-4 text-amber-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-amber-900">
                Location Unavailable
              </p>
              <p className="text-xs leading-relaxed text-amber-800/90 mt-0.5">
                {detailMessage || "Please turn on GPS or permit browser location access."}
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col-reverse gap-2.5 sm:flex-row pt-1">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 justify-center rounded-xl py-2.5 font-medium border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Button>
          <Button
            onClick={onRetry}
            disabled={isLoading}
            className="flex-1 justify-center rounded-xl py-2.5 bg-gradient-to-r from-rose-500 to-amber-500 font-semibold text-white shadow-lg shadow-rose-500/20 hover:from-rose-600 hover:to-amber-600 transition-all"
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
    description: "Working inside company office premises",
    icon: Building2,
    selectedCardClass:
      "border-primary-600 bg-primary-50/40 shadow-lg shadow-primary-500/10 ring-2 ring-primary-500/20",
    selectedIconClass: "bg-primary-600 text-white shadow-md shadow-primary-500/25 scale-105",
    hoverClass: "border-slate-200 hover:border-slate-300 hover:bg-slate-50/70",
    defaultIconClass: "bg-slate-100 text-slate-600 group-hover:bg-primary-100 group-hover:text-primary-600",
    checkBadgeClass: "bg-primary-600",
  },
  {
    value: "work_from_home",
    label: "Remote",
    description: "Working remotely or from home",
    icon: House,
    selectedCardClass:
      "border-emerald-600 bg-emerald-50/40 shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-500/20",
    selectedIconClass: "bg-emerald-600 text-white shadow-md shadow-emerald-500/25 scale-105",
    hoverClass: "border-slate-200 hover:border-slate-300 hover:bg-slate-50/70",
    defaultIconClass: "bg-slate-100 text-slate-600 group-hover:bg-emerald-100 group-hover:text-emerald-600",
    checkBadgeClass: "bg-emerald-600",
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
    <Card className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl">
      <CloseButton onClick={onClose} disabled={isLoading} />

      {/* Centered Modal Header */}
      <div className="px-6 pt-7 pb-4 text-center">
        <div className="mx-auto mb-3 flex h-13 w-13 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 ring-8 ring-primary-50/40">
          <Building2 className="h-6 w-6" />
        </div>
        <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Where are you working?
        </h3>
        <p className="mt-1 text-sm text-slate-500 max-w-xs mx-auto">
          Select your work mode to complete today's punch in.
        </p>
      </div>

      <CardContent className="space-y-6 px-6 pb-7 pt-2">
        {/* Centered 2-Column Option Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {workModeOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedMode === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onSelect(option.value)}
                className={cn(
                  "group relative flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-200 text-center cursor-pointer select-none",
                  isSelected ? option.selectedCardClass : option.hoverClass
                )}
              >
                {/* Selection indicator pill */}
                {isSelected && (
                  <div
                    className={cn(
                      "absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full text-white shadow-sm",
                      option.checkBadgeClass
                    )}
                  >
                    <Check className="h-3 w-3 stroke-[3]" />
                  </div>
                )}

                {/* Centered Icon Container */}
                <div
                  className={cn(
                    "flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-200 mb-3.5",
                    isSelected ? option.selectedIconClass : option.defaultIconClass
                  )}
                >
                  <Icon className="h-7 w-7" />
                </div>

                {/* Centered Labels */}
                <h4 className="text-base font-bold text-slate-900 mb-1">
                  {option.label}
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed max-w-[160px]">
                  {option.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-center text-sm text-rose-700">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Centered Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-1">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 justify-center py-2.5 rounded-xl border-slate-200 font-semibold text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading || !selectedMode}
            className="flex-1 justify-center py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 font-semibold text-white shadow-lg shadow-primary-600/25 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Punching In...
              </>
            ) : (
              <>
                Confirm Punch In
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  </ModalShell>
);
