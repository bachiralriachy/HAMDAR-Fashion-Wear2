import React, { useState, useEffect } from 'react';
import { X, Lock, ShieldAlert, AlertTriangle } from 'lucide-react';
import { useStore } from '../context/StoreContext.tsx';
import { AdminDashboard } from './AdminDashboard.tsx';

export const AdminLockModal: React.FC = () => {
  const {
    isAdminModalOpen,
    setIsAdminModalOpen,
    isAdminLoggedIn,
    loginWithPin,
    isInitialSetup,
    settings
  } = useStore();

  const [pin, setPin] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lockoutTime, setLockoutTime] = useState<number | null>(null);

  useEffect(() => {
    if (!isAdminModalOpen) {
      setPin('');
      setErrorMessage(null);
    }
  }, [isAdminModalOpen]);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutTime && lockoutTime > 0) {
      const timer = setInterval(() => {
        setLockoutTime((prev) => (prev && prev > 1 ? prev - 1 : null));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [lockoutTime]);

  if (!isAdminModalOpen) return null;

  // If already logged in, show the actual Admin Dashboard!
  if (isAdminLoggedIn) {
    return <AdminDashboard onClose={() => setIsAdminModalOpen(false)} />;
  }

  const handleKeyPress = (num: string) => {
    if (lockoutTime) return;
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      setErrorMessage(null);
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setErrorMessage(null);
  };

  const handleClear = () => {
    setPin('');
    setErrorMessage(null);
  };

  const handleUnlockPin = async () => {
    if (pin.length !== 4) {
      setErrorMessage('Please enter all 4 digits of your PIN.');
      return;
    }
    setLoading(true);
    setErrorMessage(null);

    const res = await loginWithPin(pin);
    setLoading(false);

    if (!res.success) {
      setPin('');
      setErrorMessage(res.error || 'Incorrect PIN entered.');
      if (res.error?.includes('Locked out') || res.error?.includes('locked')) {
        setLockoutTime(300); // 5 minutes
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 text-center text-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={() => setIsAdminModalOpen(false)}
          className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white rounded-full transition-colors cursor-pointer"
          aria-label="Close admin modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="flex items-center justify-center tracking-widest text-xl font-extrabold text-white uppercase select-none mb-6">
          {settings.logoText === 'HAMDAR' ? (
            <>
              <span>HAMD</span>
              <span className="text-red-600">A</span>
              <span>R</span>
            </>
          ) : (
            <span>{settings.logoText || 'HAMDAR'}</span>
          )}
        </div>

        {/* Lock Icon */}
        <div className="w-16 h-16 rounded-full bg-zinc-800 border border-zinc-700/80 flex items-center justify-center mx-auto mb-4 text-zinc-300 shadow-inner">
          <Lock className="w-7 h-7 text-zinc-200" />
        </div>

        <h3 className="text-xl font-black tracking-tight text-white">Admin Access</h3>
        <p className="text-xs text-zinc-400 mt-1 mb-6">
          Enter your 4-digit PIN
        </p>

        {/* Error or Lockout notification */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-950/80 border border-red-800/80 rounded-xl text-xs text-red-300 flex items-center gap-2 text-left">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {lockoutTime && lockoutTime > 0 && (
          <div className="mb-4 p-3 bg-amber-950/80 border border-amber-800/80 rounded-xl text-xs text-amber-300 flex items-center gap-2 text-left">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
            <span>Security Lockout: Try again in {Math.floor(lockoutTime / 60)}m {lockoutTime % 60}s</span>
          </div>
        )}

        {/* Initial setup prompt if default PIN */}
        {isInitialSetup && (
          <div className="mb-4 p-2.5 bg-blue-950/60 border border-blue-800/60 rounded-xl text-[11px] text-blue-300">
            Initial setup default PIN: <strong className="font-mono text-white">1234</strong>
          </div>
        )}

        <div>
          {/* 4 PIN Dots */}
          <div className="flex items-center justify-center gap-4 mb-6">
            {[0, 1, 2, 3].map((idx) => {
              const filled = pin.length > idx;
              return (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-full transition-all duration-200 ${
                    filled
                      ? 'bg-red-600 ring-4 ring-red-600/30 scale-110'
                      : 'bg-zinc-800 border-2 border-zinc-700'
                  }`}
                />
              );
            })}
          </div>

          {/* Virtual Keypad (0-9) */}
          <div className="grid grid-cols-3 gap-3 mb-6 max-w-xs mx-auto">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                type="button"
                disabled={Boolean(lockoutTime)}
                onClick={() => handleKeyPress(String(num))}
                className="h-12 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-lg font-bold text-white transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="h-12 rounded-xl bg-zinc-900/50 hover:bg-zinc-800 text-xs font-semibold text-zinc-400 transition-all cursor-pointer"
            >
              Clear
            </button>
            <button
              type="button"
              disabled={Boolean(lockoutTime)}
              onClick={() => handleKeyPress('0')}
              className="h-12 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-lg font-bold text-white transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="h-12 rounded-xl bg-zinc-900/50 hover:bg-zinc-800 text-xs font-semibold text-zinc-400 transition-all cursor-pointer"
            >
              ⌫
            </button>
          </div>

          {/* Unlock Button matching uploaded design */}
          <button
            onClick={handleUnlockPin}
            disabled={pin.length !== 4 || loading || Boolean(lockoutTime)}
            className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold text-sm tracking-wide rounded-xl shadow-lg transition-all active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? 'Verifying PIN...' : 'Unlock'}
          </button>
        </div>
      </div>
    </div>
  );
};
