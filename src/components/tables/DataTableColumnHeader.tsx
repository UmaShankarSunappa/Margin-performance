'use client';
import { useState } from 'react';
import { ChevronsUpDown, SortAsc, SortDesc } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { formatCurrency, formatNumber } from '@/lib/utils';

interface DataTableColumnHeaderProps {
  title: string;
  columnId: string;
  options: string[];
  onFilterChange: (columnId: string, selectedValues: string[]) => void;
  className?: string;
  format?: 'currency' | 'number';
}

export function DataTableColumnHeader({
  title,
  columnId,
  options,
  onFilterChange,
  className,
  format,
}: DataTableColumnHeaderProps) {
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (value: string) => {
    const newSelected = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value];
    setSelectedValues(newSelected);
  };

  const applyFilter = () => {
    onFilterChange(columnId, selectedValues);
    setIsOpen(false);
  };
  
  const clearFilter = () => {
    setSelectedValues([]);
    onFilterChange(columnId, []);
    setIsOpen(false);
  }
  
  const formatValue = (value: string) => {
    const num = parseFloat(value);
    if(isNaN(num)) return value;

    if (format === 'currency') return formatCurrency(num);
    if (format === 'number') return formatNumber(num);
    return value;
  }

  return (
    <th className={cn('h-12 px-4 text-left align-middle font-medium text-muted-foreground', className)}>
      <div className="flex items-center space-x-2">
        <span>{title}</span>
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 h-8 data-[state=open]:bg-accent"
            >
              <ChevronsUpDown className="h-4 w-4" />
              {selectedValues.length > 0 && (
                <>
                  <Separator orientation="vertical" className="mx-2 h-4" />
                  <Badge
                    variant="secondary"
                    className="rounded-sm px-1 font-normal"
                  >
                    {selectedValues.length}
                  </Badge>
                </>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0" align="start">
            <Command>
              <CommandInput placeholder={`Search ${title}...`} />
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup>
                  {options
                    .sort((a, b) => {
                        const numA = parseFloat(a);
                        const numB = parseFloat(b);
                        if(!isNaN(numA) && !isNaN(numB)) return numB - numA;
                        return a.localeCompare(b);
                    })
                    .map((option) => (
                    <CommandItem
                      key={option}
                      onSelect={() => handleSelect(option)}
                    >
                      <Checkbox
                        className="mr-2"
                        checked={selectedValues.includes(option)}
                        onCheckedChange={() => handleSelect(option)}
                      />
                      <span>{formatValue(option)}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
                {(selectedValues.length > 0 || options.length > 0) && (
                   <CommandSeparator />
                )}
                <CommandGroup>
                    <CommandItem onSelect={applyFilter} className="justify-center text-center text-primary font-semibold">
                        Apply
                    </CommandItem>
                    {selectedValues.length > 0 && (
                        <CommandItem onSelect={clearFilter} className="justify-center text-center">
                            Clear filters
                        </CommandItem>
                    )}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </th>
  );
}
