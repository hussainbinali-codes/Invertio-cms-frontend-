import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './Card';
import Button from './Button';
import { Shield } from 'lucide-react';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';

const ConfirmationModal = ({
  isOpen,
  onClose,
  title,
  message,
  onConfirm,
  confirmText = 'Confirm',
  variant = 'primary'
}) => {
  useLockBodyScroll(isOpen);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 text-slate-900 animate-in fade-in duration-200">
      <Card className="w-full max-w-md shadow-2xl animate-in zoom-in duration-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            {variant === 'danger' && <Shield className="w-5 h-5 text-rose-500" />}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          <p className="text-sm text-slate-600 leading-relaxed">
            {message}
          </p>
          <div className="flex gap-3 justify-end">
            <Button 
              variant="secondary" 
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button 
              variant={variant === 'danger' ? 'danger' : 'primary'}
              className={variant === 'danger' ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg' : ''}
              onClick={() => {
                if (onConfirm) onConfirm();
                onClose();
              }}
            >
              {confirmText}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConfirmationModal;
