'use client';
import { useSearchParams } from 'next/navigation';
import { BarChartHorizontal } from 'lucide-react';
import Link from 'next/link';
import { Button } from './ui/button';

const MedPlusLogo = () => (
    <svg width="120" height="40" viewBox="0 0 165 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="165" height="40" rx="8" fill="#D52B1E"/>
        <text fill="white" fontFamily="Arial, sans-serif" fontSize="24" fontWeight="bold">
            <tspan x="10" y="28">MedPlus</tspan>
        </text>
        <g transform="translate(125 8)">
            <rect width="24" height="24" rx="4" fill="white"/>
            <path d="M12 5V19M5 12H19" stroke="#009639" strokeWidth="3" strokeLinecap="round"/>
        </g>
    </svg>
);


export default function Header() {
  const searchParams = useSearchParams();
  
  const getMarginAnalysisLink = () => {
    // Forward all current search params to the margin analysis page
    const queryString = searchParams.toString();
    return `/margin-analysis${queryString ? `?${queryString}` : ''}`;
  }


  return (
    <header className="sticky top-0 z-30 flex h-20 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-6">
        <div className="flex items-center gap-4">
            <Link
                href="/"
                className="flex items-center gap-2 text-lg font-semibold sm:text-base"
              >
                <MedPlusLogo />
                <span className="sr-only">Margin Performance Dashboard</span>
            </Link>
            <h1 className="text-xl font-semibold">Margin Performance Dashboard</h1>
        </div>
    </header>
  );
}
