'use client';

import Link from 'next/link';
import { Home, Search, ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

const poppins: React.CSSProperties = { fontFamily: "'Poppins', sans-serif" };
const outfit: React.CSSProperties = { fontFamily: "'Outfit', sans-serif" };

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        {/* 404 Visual */}
        <div className="relative mb-8">
          <h1 
            className="text-[150px] md:text-[200px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 leading-none"
            style={{ ...outfit, fontWeight: 900, lineHeight: 1 }}
          >
            404
          </h1>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <Search className="w-16 h-16 text-purple-600/20" />
          </div>
        </div>

        <h2 
          className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
          style={{ ...outfit, fontWeight: 800 }}
        >
          Page Not Found
        </h2>
        
        <p 
          className="text-gray-600 mb-8 max-w-sm mx-auto"
          style={{ ...poppins, fontSize: '16px', lineHeight: 1.6 }}
        >
          Oops! The page you&apos;re looking for seems to have wandered off. 
          Let&apos;s get you back on track.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className=" justifyinline-flex items-center-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition-all hover:scale-105"
            style={{ ...poppins, fontWeight: 600 }}
          >
            <Home className="w-5 h-5" />
            Go Home
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:border-purple-300 hover:bg-purple-50 transition-all"
            style={{ ...poppins, fontWeight: 600 }}
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
        </div>

        {/* Help Links */}
        <div className="mt-12 pt-8 border-t border-gray-100">
          <p className="text-sm text-gray-500 mb-4" style={poppins}>
            Need help? Contact our support team
          </p>
          <a 
            href="mailto:support@sprintern.in"
            className="text-purple-600 hover:text-purple-700 font-medium"
            style={poppins}
          >
            support@sprintern.in
          </a>
        </div>
      </div>
    </div>
  );
}
