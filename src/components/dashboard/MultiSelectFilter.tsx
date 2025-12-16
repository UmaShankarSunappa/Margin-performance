'use client';
import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { SelectTrigger, SelectValue } from '../ui/select';

interface MultiSelectFilterProps {
  icon: LucideIcon;
  title: string;
  options: string[];
  selectedValues: string[];
  onSelectedChange: (selected: string[]) => void;
}

export default function MultiSelectFilter({
  icon: Icon,
  title,
  options,
  selectedValues,
  onSelectedChange,
}: MultiSelectFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (value: string) => {
    const newSelected = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value];
    onSelectedChange(newSelected);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
         <Button variant="outline" size="sm" className="h-9 w-full sm:w-auto rounded-full justify-start text-left font-normal">
            <Icon className="mr-2" />
            <div className="flex-1">{title}</div>
            {selectedValues.length > 0 && (
            <>
                <Separator orientation="vertical" className="mx-2 h-4" />
                <Badge
                variant="secondary"
                className="rounded-sm px-1 font-normal lg:hidden"
                >
                {selectedValues.length}
                </Badge>
                <Badge
                  variant="secondary"
                  className="rounded-sm px-1 font-normal hidden lg:block"
                >
                  {selectedValues.length} selected
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
              {options.sort().map((option) => (
                <CommandItem
                  key={option}
                  onSelect={() => handleSelect(option)}
                  className="cursor-pointer"
                >
                   <Checkbox
                    className="mr-2"
                    checked={selectedValues.includes(option)}
                    onCheckedChange={() => handleSelect(option)}
                  />
                  <span>{option}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            {selectedValues.length > 0 && (
                <>
                    <CommandSeparator />
                    <CommandGroup>
                        <CommandItem
                            onSelect={() => onSelectedChange([])}
                            className="justify-center text-center text-sm"
                        >
                            Clear filters
                        </CommandItem>
                    </CommandGroup>
                </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
