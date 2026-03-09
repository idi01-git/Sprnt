'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Home, RefreshCw, AlertTriangle, Mail } from 'lucide-react';

const poppins: React.CSSProperties = { fontFamily: "'Poppins', sans-serif" };
const outfit: React.CSSProperties = { fontFamily: "'Outfit', sans-serif" };

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        {/* Error Visual */}
        <div className="relative mb-8">
          <div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-12 h-12 text-red-500" />
          </div>
        </div>

        <h2 
          className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
          style={{ ...outfit, fontWeight: 800 }}
        >
          Something Went Wrong
        </h2>
        
        <p 
          className="text-gray-600 mb-8 max-w-sm mx-auto"
          style={{ ...poppins, fontSize: '16px', lineHeight: 1.6 }}
        >
          We&apos;re sorry, but something unexpected happened. 
          Our team has been notified and we&apos;re working to fix it.
        </p>

        {error.digest && (
          <p className="text-xs text-gray-400 mb-6" style={poppins}>
            Error ID: {error.digest}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition-all hover:scale-105"
            style={{ ...poppins, fontWeight: 600 }}
          >
            <RefreshCw className="w-5 h-5" />
            Try Again
          </button>
          
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:border-purple-300 hover:bg-purple-50 transition-all"
            style={{ ...poppins, fontWeight: 600 }}
          >
            <Home className="w-5 h-5" />
            Go Home
          </Link>
        </div>

        {/* Contact Support */}
        <div className="mt-12 pt-8 border-t border-gray-100">
          <p className="text-sm text-gray-500 mb-4" style={poppins}>
            If this keeps happening, please contact support
          </p>
          <a 
            href="mailto:support@sprintern.in?subject=Error Report"
            className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium"
            style={poppins}
          >
            <Mail className="w-4 h-4" />
            support@sprintern.in
          </a>
        </div>
      </div>
    </div>
  );
}
