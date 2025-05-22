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
// Badge ya no se usa aquí directamente
// import { Badge } from "./badge";

// Interfaz genérica para las opciones
export interface ComboboxOption {
  value: string;
  label: string;
  [key: string]: any; // Para permitir otras propiedades si es necesario
}

// Hacer que options pueda ser string[] o ComboboxOption[]
type ComboboxOptionsType = string[] | ComboboxOption[];

interface ComboboxProps {
  options: ComboboxOptionsType;
  value: string | undefined | null; // El valor seleccionado (debe ser el 'value' de la opción)
  onChange: (value: string) => void; // Siempre devuelve el 'value' de la opción (string)
  
  // Funciones para extraer valor y etiqueta si options es ComboboxOption[]
  // Si options es string[], estas no son necesarias y se usa el string directamente.
  getOptionValue?: (option: string | ComboboxOption) => string;
  getOptionLabel?: (option: string | ComboboxOption) => string;
  
  onAddOption?: (newLabel: string) => void; // Callback para añadir una nueva opción (basada en el input de búsqueda)
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  addButtonLabel?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  className?: string; // Para estilizar el PopoverTrigger/Button
}

export function Combobox({
  options,
  value,
  onChange,
  getOptionValue = (opt) => (typeof opt === 'string' ? opt : opt.value),
  getOptionLabel = (opt) => (typeof opt === 'string' ? opt : opt.label),
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
  const [inputValue, setInputValue] = React.useState(""); // Para el texto del input de búsqueda

  const _getOptionValue = (option: string | ComboboxOption): string => {
    return typeof option === 'string' ? option : getOptionValue(option);
  };

  const _getOptionLabel = (option: string | ComboboxOption): string => {
    return typeof option === 'string' ? option : getOptionLabel(option);
  };

  const handleSelect = (option: string | ComboboxOption) => {
    const selectedValue = _getOptionValue(option);
    onChange(selectedValue === value ? "" : selectedValue); // Deseleccionar si se clickea el mismo, o seleccionar
    setOpen(false);
    setInputValue(""); 
  };

  const handleAddOptionInternal = () => {
    if (inputValue.trim() && onAddOption) {
      // Verificar si la opción (basada en el label/inputValue) ya existe
      const alreadyExists = options.some(opt => 
        _getOptionLabel(opt).toLowerCase() === inputValue.trim().toLowerCase()
      );
      if (!alreadyExists) {
        onAddOption(inputValue.trim()); // onAddOption recibe el label/texto ingresado
        // El componente padre se encargará de añadirlo y el `onChange` se llamará cuando
        // el `value` del formulario se actualice con el nuevo `value` de la opción creada.
        // Opcionalmente, podríamos llamar a onChange aquí con el inputValue si el backend
        // devuelve el nuevo ID inmediatamente, pero es más seguro dejar que el form se actualice.
      }
    }
    setInputValue("");
    setOpen(false);
  };
  
  const filteredOptions = React.useMemo(() => {
    if (!inputValue.trim()) return options;
    return options.filter(option => 
      _getOptionLabel(option).toLowerCase().includes(inputValue.toLowerCase().trim())
    );
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
          className={cn("w-full justify-between font-normal", className)} // Añadido font-normal, className
          disabled={disabled}
        >
          <div className="flex items-center truncate"> {/* Añadido truncate */}
            {icon && <span className="mr-2 shrink-0">{icon}</span>} {/* shrink-0 para icono */}
            <span className="truncate">{displayValue}</span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={inputValue}
            onValueChange={setInputValue}
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
                return (
                  <CommandItem
                    key={typeof option === 'string' ? option : option.value || `option-${index}`} // Clave más robusta
                    value={optionLabel} // CMDK usa esto para búsqueda interna si shouldFilter=true y para accesibilidad
                    onSelect={() => handleSelect(option)}
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
            {/* Lógica para "Añadir opción" si se escribe y no coincide exactamente */}
            {onAddOption && 
             inputValue.trim() && 
             !options.some(opt => _getOptionLabel(opt).toLowerCase() === inputValue.trim().toLowerCase()) && 
             filteredOptions.length > 0 && /* Solo mostrar si hay otras opciones filtradas para no duplicar el botón de CommandEmpty */
            (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={handleAddOptionInternal}
                    value={`add-${inputValue.trim()}`} // Valor único para CMDK
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