
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
  options: string[];
  value: string;
  onChange: (value: string) => void;
  onAddOption?: (value: string) => void; // Callback to add a new option
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  addButtonLabel?: string;
  disabled?: boolean;
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
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  const handleSelect = (currentValue: string) => {
    onChange(currentValue === value ? "" : currentValue);
    setOpen(false);
  };

  const handleAddOption = () => {
    if (inputValue.trim() && onAddOption && !options.some(opt => opt.toLowerCase() === inputValue.toLowerCase().trim())) {
      onAddOption(inputValue.trim());
      onChange(inputValue.trim()); // Select the newly added option
    }
    setInputValue("");
    setOpen(false);
  };
  
  const filteredOptions = options.filter(option => option.toLowerCase().includes(inputValue.toLowerCase()));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {value
            ? options.find((option) => option.toLowerCase() === value.toLowerCase()) || value
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput
            placeholder={searchPlaceholder}
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandList>
            <CommandEmpty>
              {emptyMessage}
              {onAddOption && inputValue.trim() && (
                 <Button variant="ghost" size="sm" className="w-full justify-start mt-1" onClick={handleAddOption}>
                   <PlusCircle className="mr-2 h-4 w-4" />
                   {addButtonLabel} "{inputValue.trim()}"
                 </Button>
              )}
            </CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option}
                  value={option}
                  onSelect={handleSelect}
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
                    onSelect={handleAddOption}
                    value={inputValue} // Ensure this value is unique or handled
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
