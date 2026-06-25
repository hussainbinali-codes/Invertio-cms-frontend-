import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./Card";
import Button from "./Button";
import {
  Shield,
  AlertTriangle,
  Info,
  CheckCircle,
  X,
  HelpCircle,
  Clock,
} from "lucide-react";
import { useLockBodyScroll } from "../../hooks/useLockBodyScroll";

const ConfirmationModal = ({
  isOpen,
  onClose,
  title,
  message,
  onConfirm,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "primary",
  isLoading = false,
  closeOnConfirm = true,
  showCloseButton = true,
  closeOnBackdropClick = true,
  size = "md", // sm, md, lg
  icon = null,
  additionalInfo = null,
  timeSensitive = false,
  countdownSeconds = null,
}) => {
  useLockBodyScroll(isOpen);
  const [countdown, setCountdown] = useState(countdownSeconds);
  const [isConfirmDisabled, setIsConfirmDisabled] = useState(
    countdownSeconds > 0,
  );

  // Handle countdown timer for sensitive actions
  useEffect(() => {
    if (isOpen && timeSensitive && countdownSeconds > 0) {
      setCountdown(countdownSeconds);
      setIsConfirmDisabled(true);

      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setIsConfirmDisabled(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isOpen, timeSensitive, countdownSeconds]);

  if (!isOpen) return null;

  // Size configurations
  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
  };

  // Variant configurations
  const variantConfig = {
    primary: {
      icon: icon || <Info className="w-5 h-5 text-blue-500" />,
      confirmButtonClass:
        "bg-primary-600 hover:bg-primary-700 text-white shadow-lg",
      iconBgClass: "bg-blue-50",
      borderClass: "border-blue-100",
    },
    danger: {
      icon: icon || <Shield className="w-5 h-5 text-rose-500" />,
      confirmButtonClass: "bg-rose-600 hover:bg-rose-700 text-white shadow-lg",
      iconBgClass: "bg-rose-50",
      borderClass: "border-rose-100",
    },
    warning: {
      icon: icon || <AlertTriangle className="w-5 h-5 text-amber-500" />,
      confirmButtonClass:
        "bg-amber-600 hover:bg-amber-700 text-white shadow-lg",
      iconBgClass: "bg-amber-50",
      borderClass: "border-amber-100",
    },
    success: {
      icon: icon || <CheckCircle className="w-5 h-5 text-emerald-500" />,
      confirmButtonClass:
        "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg",
      iconBgClass: "bg-emerald-50",
      borderClass: "border-emerald-100",
    },
  };

  const currentVariant = variantConfig[variant] || variantConfig.primary;

  const handleBackdropClick = (e) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleConfirm = async () => {
    if (isConfirmDisabled) return;
    try {
      if (onConfirm) {
        await onConfirm();
      }
      if (closeOnConfirm) {
        onClose();
      }
    } catch (error) {
      console.error("Confirmation action failed:", error);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 text-slate-900 animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <Card
        className={cn(
          "w-full shadow-2xl animate-in zoom-in-95 duration-200 relative overflow-hidden",
          sizeClasses[size],
          currentVariant.borderClass,
          "border-t-4",
        )}
      >
        {/* Close Button - Top Right */}
        {showCloseButton && (
          <button
            onClick={onClose}
            disabled={isLoading}
            className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all duration-200 z-10"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Header with Icon */}
        <CardHeader className="pb-2 pt-6 px-6">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
                currentVariant.iconBgClass,
              )}
            >
              {currentVariant.icon}
            </div>
            <div className="flex-1 min-w-0 pr-6">
              <CardTitle className="text-xl font-bold text-slate-900">
                {title}
              </CardTitle>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 pt-4 px-6 pb-6">
          {/* Main Message */}
          <div className="space-y-2">
            <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
          </div>

          {/* Additional Info Section */}
          {additionalInfo && (
            <div className="bg-slate-50 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-slate-500" />
                <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                  Additional Information
                </p>
              </div>
              <div className="text-sm text-slate-700">{additionalInfo}</div>
            </div>
          )}

          {/* Time Sensitive Warning */}
          {timeSensitive && (
            <div className="bg-amber-50 rounded-lg p-3 flex items-center gap-3">
              <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <p className="text-xs text-amber-700">
                This action is time-sensitive. Please review carefully before
                confirming.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 justify-center px-4 py-2.5 text-sm font-medium"
            >
              {cancelText}
            </Button>
            <Button
              variant={variant === "danger" ? "danger" : "primary"}
              className={cn(
                "flex-1 justify-center px-4 py-2.5 text-sm font-medium transition-all duration-200 relative",
                currentVariant.confirmButtonClass,
                isConfirmDisabled && "opacity-50 cursor-not-allowed",
              )}
              onClick={handleConfirm}
              disabled={isLoading || isConfirmDisabled}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : (
                <>
                  {confirmText}
                  {countdown > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center w-6 h-5 bg-white/20 rounded-full text-xs">
                      {countdown}
                    </span>
                  )}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Utility function for cn (classNames) if not already imported
const cn = (...classes) => {
  return classes.filter(Boolean).join(" ");
};

export default ConfirmationModal;
