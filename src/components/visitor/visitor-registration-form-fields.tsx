
"use client";

import type { UseFormReturn } from "react-hook-form";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { VisitorFormData } from "@/app/(app)/admin-dashboard/visitors/schemas";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Combobox } from "@/components/ui/combobox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Loader2, Lightbulb, CalendarIcon, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ScrollArea } from "../ui/scroll-area";

interface VisitorRegistrationFormFieldsProps {
  form: UseFormReturn<VisitorFormData>;
  isCategorizing: boolean;
  suggestedCategory: string | null;
  // Options states and handlers
  tipoDocumentoOptions: string[];
  onAddTipoDocumento: (newOption: string) => void;
  generoOptions: string[];
  onAddGenero: (newOption: string) => void;
  rhOptions: string[];
  onAddRh: (newOption: string) => void;
  tipoVisitaOptions: string[];
  onAddTipoVisita: (newOption: string) => void;
  arlOptions: string[];
  onAddArl: (newOption: string) => void;
  epsOptions: string[];
  onAddEps: (newOption: string) => void;
  employeeComboboxOptions: { value: string; label: string }[];
  isSubmitting?: boolean; // Optional for controlling submit button state
}

export default function VisitorRegistrationFormFields({
  form,
  isCategorizing,
  suggestedCategory,
  tipoDocumentoOptions,
  onAddTipoDocumento,
  generoOptions,
  onAddGenero,
  rhOptions,
  onAddRh,
  tipoVisitaOptions,
  onAddTipoVisita,
  arlOptions,
  onAddArl,
  epsOptions,
  onAddEps,
  employeeComboboxOptions,
}: VisitorRegistrationFormFieldsProps) {
  return (
    <ScrollArea className="h-[60vh] p-1 pr-4">
      <div className="space-y-6 p-2">
        {/* Información Personal del Visitante */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Información Personal del Visitante</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="tipodocumento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Documento</FormLabel>
                  <Combobox
                    options={tipoDocumentoOptions}
                    value={field.value || ""}
                    onChange={field.onChange}
                    onAddOption={onAddTipoDocumento}
                    placeholder="Seleccione o escriba tipo"
                    searchPlaceholder="Buscar o agregar tipo..."
                    emptyMessage="Tipo no encontrado. Puede agregarlo."
                    addButtonLabel="Agregar tipo"
                    disabled={field.disabled}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="numerodocumento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de Documento</FormLabel>
                  <FormControl><Input placeholder="Ej: 123456789" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nombres"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombres</FormLabel>
                  <FormControl><Input placeholder="Ej: Ana María" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="apellidos"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Apellidos</FormLabel>
                  <FormControl><Input placeholder="Ej: Pérez Gómez" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="genero"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Género</FormLabel>
                  <Combobox
                    options={generoOptions}
                    value={field.value || ""}
                    onChange={field.onChange}
                    onAddOption={onAddGenero}
                    placeholder="Seleccione o escriba género"
                    searchPlaceholder="Buscar o agregar género..."
                    emptyMessage="Género no encontrado. Puede agregarlo."
                    addButtonLabel="Agregar género"
                    disabled={field.disabled}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fechanacimiento"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="mb-1.5">Fecha de Nacimiento</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                          disabled={field.disabled}
                        >
                          {field.value ? (
                            format(field.value, "PPP", { locale: es })
                          ) : (
                            <span>Seleccione una fecha</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                        locale={es}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="rh"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>RH</FormLabel>
                  <Combobox
                    options={rhOptions}
                    value={field.value || ""}
                    onChange={field.onChange}
                    onAddOption={onAddRh}
                    placeholder="Seleccione o escriba RH"
                    searchPlaceholder="Buscar o agregar RH..."
                    emptyMessage="RH no encontrado. Puede agregarlo."
                    addButtonLabel="Agregar RH"
                    disabled={field.disabled}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="telefono"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono</FormLabel>
                  <FormControl><Input type="tel" placeholder="Ej: 3001234567" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Detalles de la Visita */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Detalles de la Visita</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="personavisitada"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Persona a Visitar</FormLabel>
                  <Combobox
                    options={employeeComboboxOptions.map(opt => opt.label)}
                    value={
                      employeeComboboxOptions.find(opt => opt.label === field.value)?.label || field.value || ""
                    }
                    onChange={(selectedLabel) => {
                      field.onChange(selectedLabel);
                    }}
                    placeholder="Buscar empleado por nombre o ID..."
                    searchPlaceholder="Escriba nombre o ID del empleado..."
                    emptyMessage="Empleado no encontrado."
                    disabled={field.disabled}
                    icon={<UserCheck className="mr-2 h-4 w-4 text-primary" />}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="purpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Propósito de la Visita</FormLabel>
                  <FormControl><Textarea placeholder="Ej: Reunión de seguimiento, Entrega de documentos" {...field} rows={3} /></FormControl>
                  {isCategorizing && <FormDescription className="flex items-center"><Loader2 className="mr-2 h-3 w-3 animate-spin" /> Sugiriendo categoría...</FormDescription>}
                  {suggestedCategory && !isCategorizing && (
                    <FormDescription className="flex items-center gap-1 pt-1">
                      <Lightbulb className="h-3 w-3 text-yellow-500" />
                      <span>Sugerencia:</span>
                      <Badge variant="secondary" className="cursor-default">{suggestedCategory}</Badge>
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem className="hidden">
                  <FormControl><Input {...field} /></FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tipovisita"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Visita</FormLabel>
                  <Combobox
                    options={tipoVisitaOptions}
                    value={field.value || ""}
                    onChange={field.onChange}
                    onAddOption={onAddTipoVisita}
                    placeholder="Seleccione o escriba tipo"
                    searchPlaceholder="Buscar o agregar tipo..."
                    emptyMessage="Tipo no encontrado. Puede agregarlo."
                    addButtonLabel="Agregar tipo"
                    disabled={field.disabled}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Información Adicional (Opcional)</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="empresaProviene"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Empresa de Origen</FormLabel>
                  <FormControl><Input placeholder="Ej: Acme Corp" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="numerocarnet"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de Carnet/Identificación Empresa</FormLabel>
                  <FormControl><Input placeholder="Ej: E-12345" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="vehiculoPlaca"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Placa del Vehículo</FormLabel>
                  <FormControl><Input placeholder="Ej: XYZ123" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Salud y Seguridad</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="arl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ARL</FormLabel>
                  <Combobox
                    options={arlOptions}
                    value={field.value || ""}
                    onChange={field.onChange}
                    onAddOption={onAddArl}
                    placeholder="Seleccione o escriba ARL"
                    searchPlaceholder="Buscar o agregar ARL..."
                    emptyMessage="ARL no encontrada. Puede agregarla."
                    addButtonLabel="Agregar ARL"
                    disabled={field.disabled}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="eps"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>EPS</FormLabel>
                  <Combobox
                    options={epsOptions}
                    value={field.value || ""}
                    onChange={field.onChange}
                    onAddOption={onAddEps}
                    placeholder="Seleccione o escriba EPS"
                    searchPlaceholder="Buscar o agregar EPS..."
                    emptyMessage="EPS no encontrada. Puede agregarla."
                    addButtonLabel="Agregar EPS"
                    disabled={field.disabled}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Contacto de Emergencia</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="contactoemergencianombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombres</FormLabel>
                  <FormControl><Input placeholder="Ej: Carlos" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contactoemergenciaapellido"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Apellidos</FormLabel>
                  <FormControl><Input placeholder="Ej: Rodríguez" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contactoemergenciatelefono"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono</FormLabel>
                  <FormControl><Input type="tel" placeholder="Ej: 3109876543" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contactoemergenciaparentesco"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parentesco</FormLabel>
                  <FormControl><Input placeholder="Ej: Hermano, Esposa" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}
