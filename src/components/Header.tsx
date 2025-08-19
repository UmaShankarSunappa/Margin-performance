import { AreaChart, BarChartHorizontal } from 'lucide-react';
import Link from 'next/link';
import { Button } from './ui/button';

export default function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
        <div className="flex items-center gap-4">
            <Link
                href="/"
                className="flex items-center gap-2 text-lg font-semibold sm:text-base"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <AreaChart className="h-6 w-6" />
                </div>
                <span className="sr-only">MarginWise Telangana</span>
            </Link>
            <h1 className="text-xl font-semibold">MarginWise Telangana</h1>
        </div>
        <nav className="ml-auto flex items-center gap-2">
            <Button variant="outline" asChild>
                <Link href="/margin-analysis">
                    <BarChartHorizontal className="mr-2 h-4 w-4" />
                    Margin Analysis
                </Link>
            </Button>
        </nav>
    </header>
  );
}
