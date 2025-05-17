
"use client";

import * as React from "react";
import { Check, ChevronsUpDown, PlusCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "./badge";

interface ComboboxProps {
  options: string[]; // Can be string array or array of objects for more complex scenarios
  value: string;
  onChange: (value: string) => void;
  onAddOption?: (value: string) => void; // Callback to add a new option
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  addButtonLabel?: string;
  disabled?: boolean;
  icon?: React.ReactNode; // Optional icon for the trigger button
}

export function Combobox({
  options,
  value,
  onChange,
  onAddOption,
  placeholder = "Seleccione una opción...",
  searchPlaceholder = "Buscar opción...",
  emptyMessage = "No se encontró la opción.",
  addButtonLabel = "Agregar",
  disabled,
  icon, // Destructure icon
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(""); // For search input within Command

  const handleSelect = (currentValue: string) => {
    onChange(currentValue === value ? "" : currentValue);
    setOpen(false);
    setInputValue(""); // Reset search input on select
  };

  const handleAddOptionInternal = () => {
    if (inputValue.trim() && onAddOption && !options.some(opt => opt.toLowerCase() === inputValue.toLowerCase().trim())) {
      onAddOption(inputValue.trim());
      onChange(inputValue.trim()); // Select the newly added option
    }
    setInputValue(""); // Reset search input
    setOpen(false);
  };
  
  // Filter options based on the inputValue (search term)
  const filteredOptions = React.useMemo(() => {
    if (!inputValue) return options;
    return options.filter(option => option.toLowerCase().includes(inputValue.toLowerCase()));
  }, [options, inputValue]);

  // Determine the display value for the PopoverTrigger button
  const displayValue = value ? options.find((option) => option.toLowerCase() === value.toLowerCase()) || value : placeholder;

  return (
    <Popover open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) setInputValue(""); // Reset search input when popover closes
    }}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          <div className="flex items-center">
            {icon && <span className="mr-2">{icon}</span>}
            <span className="truncate">{displayValue}</span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command shouldFilter={false}> {/* Disable CMDK's internal filtering as we do it manually */}
          <CommandInput
            placeholder={searchPlaceholder}
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandList>
            <CommandEmpty>
              {filteredOptions.length === 0 && inputValue.trim() ? (
                <>
                  {emptyMessage}
                  {onAddOption && (
                     <Button variant="ghost" size="sm" className="w-full justify-start mt-1" onClick={handleAddOptionInternal}>
                       <PlusCircle className="mr-2 h-4 w-4" />
                       {addButtonLabel} "{inputValue.trim()}"
                     </Button>
                  )}
                </>
              ) : (
                emptyMessage // Show only empty message if no input value or no options
              )}
            </CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option}
                  value={option} // CMDK uses this for its internal state, but we handle selection with `onSelect`
                  onSelect={() => handleSelect(option)} // Use our custom select handler
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value && value.toLowerCase() === option.toLowerCase() ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option}
                </CommandItem>
              ))}
            </CommandGroup>
            {onAddOption && inputValue.trim() && !filteredOptions.some(opt => opt.toLowerCase() === inputValue.toLowerCase().trim()) && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={handleAddOptionInternal}
                    value={`add-${inputValue}`} // Ensure this value is unique or handled
                    className="text-sm"
                  >
                    <PlusCircle className="mr-2 h-4 w-4 text-primary" />
                    {addButtonLabel} "<span className="font-semibold">{inputValue.trim()}</span>"
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
