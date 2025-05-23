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

export interface ComboboxOption {
  value: string;
  label: string;
  [key: string]: any; 
}

type ComboboxOptionsType = string[] | ComboboxOption[];

interface ComboboxProps {
  options: ComboboxOptionsType;
  value: string | undefined | null;
  onChange: (value: string) => void; 
  getOptionValue?: (option: string | ComboboxOption) => string;
  getOptionLabel?: (option: string | ComboboxOption) => string; // Permitir que pueda devolver undefined temporalmente
  onAddOption?: (newLabel: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  addButtonLabel?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export function Combobox({
  options,
  value,
  onChange,
  getOptionValue: getOptionValueProp = (opt) => (typeof opt === 'string' ? opt : opt.value),
  getOptionLabel: getOptionLabelProp = (opt) => (typeof opt === 'string' ? opt : opt.label),
  onAddOption,
  placeholder = "Seleccione una opción...",
  searchPlaceholder = "Buscar opción...",
  emptyMessage = "No se encontró la opción.",
  addButtonLabel = "Agregar",
  disabled,
  icon,
  className,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  // MODIFICADO: _getOptionValue para asegurar que devuelva string
  const _getOptionValue = React.useCallback((option: string | ComboboxOption): string => {
    const val = typeof option === 'string' ? option : getOptionValueProp(option);
    return typeof val === 'string' ? val : ''; // Devolver string vacío si no es string
  }, [getOptionValueProp]);

  // MODIFICADO: _getOptionLabel para asegurar que devuelva string
  const _getOptionLabel = React.useCallback((option: string | ComboboxOption): string => {
    const label = typeof option === 'string' ? option : getOptionLabelProp(option);
    return typeof label === 'string' ? label : ''; // Devolver string vacío si no es string
  }, [getOptionLabelProp]);


  const handleSelect = (option: string | ComboboxOption) => {
    const selectedValue = _getOptionValue(option);
    onChange(selectedValue === value ? "" : selectedValue);
    setOpen(false);
    setInputValue(""); 
  };

  const handleAddOptionInternal = () => {
    if (inputValue.trim() && onAddOption) {
      const currentLabel = inputValue.trim();
      const alreadyExists = options.some(opt => 
        _getOptionLabel(opt).toLowerCase() === currentLabel.toLowerCase()
      );
      if (!alreadyExists) {
        onAddOption(currentLabel);
      }
    }
    setInputValue("");
    setOpen(false);
  };
  
  const filteredOptions = React.useMemo(() => {
    const trimmedSearch = inputValue.toLowerCase().trim();
    if (!trimmedSearch) return options;
    
    return options.filter(option => {
      const label = _getOptionLabel(option); // Esto ahora siempre devuelve un string
      return label.toLowerCase().includes(trimmedSearch);
    });
  }, [options, inputValue, _getOptionLabel]);

  const selectedOption = React.useMemo(() => {
    if (value === null || value === undefined || value === "") return null;
    return options.find((option) => _getOptionValue(option) === value);
  }, [options, value, _getOptionValue]);

  const displayValue = selectedOption ? _getOptionLabel(selectedOption) : placeholder;
  
  return (
    <Popover open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) setInputValue("");
    }}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between font-normal", className)}
          disabled={disabled}
        >
          <div className="flex items-center truncate">
            {icon && <span className="mr-2 shrink-0">{icon}</span>}
            <span className="truncate">{displayValue}</span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command shouldFilter={false}> {/* La lógica de filtro ya la hacemos nosotros */}
          <CommandInput
            placeholder={searchPlaceholder}
            value={inputValue}
            onValueChange={setInputValue} // Actualizar inputValue en cada cambio
          />
          <CommandList>
            {filteredOptions.length === 0 && !inputValue.trim() && (
                 <CommandEmpty>{emptyMessage}</CommandEmpty>
            )}
            {filteredOptions.length === 0 && inputValue.trim() && (
              <CommandEmpty>
                {emptyMessage}
                {onAddOption && (
                    <Button variant="ghost" size="sm" className="w-full justify-start mt-1 text-sm" onClick={handleAddOptionInternal}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {addButtonLabel} "<span className="font-medium truncate max-w-[150px]">{inputValue.trim()}</span>"
                    </Button>
                )}
              </CommandEmpty>
            )}
            <CommandGroup>
              {filteredOptions.map((option, index) => {
                const optionVal = _getOptionValue(option);
                const optionLabel = _getOptionLabel(option);
                // Si optionLabel es un string vacío después de la corrección y no quieres mostrarlo:
                // if (optionLabel === '') return null; 
                return (
                  <CommandItem
                    key={optionVal || `option-${index}`} // Usar optionVal que ahora es siempre string
                    value={optionLabel} 
                    onSelect={() => handleSelect(option)}
                    // Deshabilitar si el label es vacío podría ser una opción, pero
                    // el filtrado ya debería haberlos quitado si el label original era undefined/null.
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === optionVal ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {optionLabel}
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {onAddOption && 
             inputValue.trim() && 
             !options.some(opt => _getOptionLabel(opt).toLowerCase() === inputValue.trim().toLowerCase()) && 
             filteredOptions.length > 0 &&
            (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={handleAddOptionInternal}
                    value={`add-${inputValue.trim()}`}
                    className="text-sm cursor-pointer"
                  >
                    <PlusCircle className="mr-2 h-4 w-4 text-primary" />
                    {addButtonLabel} "<span className="font-semibold truncate max-w-[150px]">{inputValue.trim()}</span>"
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