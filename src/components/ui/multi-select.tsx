
"use client"

import * as React from "react"
import { Check, X, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export type OptionType = {
  label: string;
  value: string;
};

interface MultiSelectProps {
  options: OptionType[];
  defaultValue?: string[];
  onValueChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function MultiSelect({
  options,
  defaultValue = [],
  onValueChange,
  placeholder = "Select options...",
  className,
}: MultiSelectProps) {
  const [selectedValues, setSelectedValues] = React.useState<string[]>(defaultValue);
  const [open, setOpen] = React.useState(false);

  // This effect synchronizes the component's internal state
  // with the defaultValue prop, which is controlled by the parent page.
  React.useEffect(() => {
    setSelectedValues(defaultValue);
  }, [defaultValue]);

  const handleToggle = (value: string) => {
    const newSelectedValues = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value];
    setSelectedValues(newSelectedValues);
    onValueChange(newSelectedValues);
  };

  const handleRemove = (e: React.MouseEvent, value: string) => {
    e.stopPropagation();
    const newSelectedValues = selectedValues.filter((v) => v !== value);
    setSelectedValues(newSelectedValues);
    onValueChange(newSelectedValues);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between h-auto", className)}
        >
          <div className="flex gap-1 flex-wrap">
            {selectedValues.length > 0 ? (
                selectedValues.map((value) => {
                    const label = options.find(option => option.value === value)?.label;
                    return (
                        <Badge
                            variant="secondary"
                            key={value}
                            className="mr-1"
                        >
                            {label}
                            <button
                                className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={(e) => handleRemove(e, value)}
                            >
                                <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                            </button>
                        </Badge>
                    )
                })
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  onSelect={() => handleToggle(option.value)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedValues.includes(option.value)
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
