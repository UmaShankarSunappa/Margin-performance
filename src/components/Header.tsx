import { AreaChart } from 'lucide-react';
import Link from 'next/link';

export default function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
        <Link
            href="/"
            className="flex items-center gap-2 text-lg font-semibold text-primary-foreground sm:text-base"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <AreaChart className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="sr-only">MarginWise Telangana</span>
        </Link>
        <h1 className="text-xl font-semibold">MarginWise Telangana</h1>
    </header>
  );
}
