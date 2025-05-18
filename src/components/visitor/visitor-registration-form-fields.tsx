
"use client";

import type { UseFormReturn } from "react-hook-form";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { VisitorFormData } from "@/app/(app)/admin-dashboard/visitors/schemas";
import React, { useState, useRef, useEffect, useCallback } from "react";
import Image from 'next/image';

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Combobox } from "@/components/ui/combobox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Loader2, Lightbulb, CalendarIcon, UserCheck, Camera, FileImage, ScanLine, UserSquare2, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ScrollArea } from "../ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface VisitorRegistrationFormFieldsProps {
  form: UseFormReturn<VisitorFormData>;
  isCategorizing: boolean;
  suggestedCategory: string | null;
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
  isSubmitting?: boolean;
  showScannerSection?: boolean; // Nueva prop
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
  showScannerSection = true, // Valor por defecto
}: VisitorRegistrationFormFieldsProps) {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedPhotoDataUri, setCapturedPhotoDataUri] = useState<string | null>(form.getValues('photoDataUri') || null);
  
  const [rawScannedDataInput, setRawScannedDataInput] = useState("");
  const [isProcessingScan, setIsProcessingScan] = useState(false);

  useEffect(() => {
    // Actualizar la vista previa si el valor del formulario cambia externamente
    const currentFormPhoto = form.getValues('photoDataUri');
    if (currentFormPhoto !== capturedPhotoDataUri) {
      setCapturedPhotoDataUri(currentFormPhoto || null);
    }
  }, [form.watch('photoDataUri')]);


  useEffect(() => {
    const stopCameraTracks = () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    };

    if (isCameraOpen) {
      const getCameraPermission = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          setHasCameraPermission(true);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (error) {
          console.error('Error accessing camera:', error);
          setHasCameraPermission(false);
          toast({
            variant: 'destructive',
            title: 'Acceso a Cámara Denegado',
            description: 'Por favor, active los permisos de cámara en su navegador para esta función.',
          });
          setIsCameraOpen(false);
        }
      };
      getCameraPermission();
    } else {
      stopCameraTracks();
    }
    return () => {
      stopCameraTracks();
    };
  }, [isCameraOpen, toast]);

  const handleToggleCamera = () => {
    setIsCameraOpen(prev => !prev);
  };

  const handleCaptureFromStream = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUri = canvas.toDataURL('image/jpeg');
        setCapturedPhotoDataUri(dataUri);
        form.setValue('photoDataUri', dataUri, { shouldValidate: true, shouldDirty: true });
        setIsCameraOpen(false);
        toast({ title: "Foto Capturada", description: "La foto del visitante ha sido capturada." });
      }
    } else {
        toast({ variant: "destructive", title: "Error de Captura", description: "No se pudo acceder a los elementos de video o canvas." });
    }
  };
  
  const handlePhotoInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        setCapturedPhotoDataUri(dataUri);
        form.setValue('photoDataUri', dataUri, { shouldValidate: true, shouldDirty: true });
        toast({ title: "Foto Subida", description: "La foto del visitante ha sido seleccionada." });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProcessScannedData = () => {
    setIsProcessingScan(true);
    toast({ title: "Procesando datos...", description: "Simulando lectura de cédula con lector físico." });

    setTimeout(() => {
      const MOCK_PDF417_SIMPLIFIED_TRIGGER = "SCAN_LUISA_GOMEZ"; 

      if (rawScannedDataInput.trim() === MOCK_PDF417_SIMPLIFIED_TRIGGER) {
        const mockCedulaData = {
          numeroDocumento: '1098765432',
          nombres: 'Luisa Fernanda',
          apellidos: 'Gómez Arias',
          genero: 'Femenino',
          fechanacimiento: new Date(1995, 3, 22), 
          rh: 'A+',
        };

        form.setValue('numerodocumento', mockCedulaData.numerodocumento, { shouldValidate: true });
        form.setValue('nombres', mockCedulaData.nombres, { shouldValidate: true });
        form.setValue('apellidos', mockCedulaData.apellidos, { shouldValidate: true });
        
        if (generoOptions.includes(mockCedulaData.genero) || !onAddGenero) {
          form.setValue('genero', mockCedulaData.genero, { shouldValidate: true });
        } else {
          onAddGenero(mockCedulaData.genero);
          form.setValue('genero', mockCedulaData.genero, { shouldValidate: true });
        }
        
        form.setValue('fechanacimiento', mockCedulaData.fechanacimiento, { shouldValidate: true });

        if (rhOptions.includes(mockCedulaData.rh) || !onAddRh) {
           form.setValue('rh', mockCedulaData.rh, { shouldValidate: true });
        } else {
          onAddRh(mockCedulaData.rh);
          form.setValue('rh', mockCedulaData.rh, { shouldValidate: true });
        }
        
        if (!form.getValues('tipodocumento')) {
            if (tipoDocumentoOptions.includes("CC")) {
                 form.setValue('tipodocumento', "CC", { shouldValidate: true });
            }
        }

        toast({ title: "Autocompletado Exitoso (Simulado)", description: "Datos de la cédula cargados." });
      } else {
        toast({ variant: "destructive", title: "Error de Procesamiento", description: "Los datos escaneados no coinciden con el formato esperado o no se pudieron procesar. Intente con: SCAN_LUISA_GOMEZ" });
      }
      setRawScannedDataInput(""); 
      setIsProcessingScan(false);
    }, 1500);
  };

  return (
    <ScrollArea className="h-[65vh] sm:h-[70vh] p-1 pr-4">
      <div className="space-y-6 p-2">
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        <Card>
          <CardHeader><CardTitle className="text-lg">{showScannerSection ? "Identificación Visual y por Lector" : "Identificación Visual"}</CardTitle></CardHeader>
          <CardContent className={cn(
            "grid gap-6 items-start",
            showScannerSection ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
          )}>
            {/* Columna de Fotografía */}
            <div className="space-y-3">
              <FormLabel>Fotografía del Visitante</FormLabel>
              <div className="w-full aspect-square bg-muted rounded-md flex items-center justify-center overflow-hidden border">
                {capturedPhotoDataUri ? (
                  <Image src={capturedPhotoDataUri} alt="Foto del visitante" width={200} height={200} className="object-cover w-full h-full" data-ai-hint="person portrait" />
                ) : (
                  <UserSquare2 className="w-24 h-24 text-muted-foreground" />
                )}
              </div>
              {isCameraOpen && hasCameraPermission !== false && (
                <div className="w-full aspect-video bg-black rounded-md overflow-hidden mt-2">
                  <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
                </div>
              )}
              {hasCameraPermission === false && !isCameraOpen && (
                 <Alert variant="destructive" className="mt-2">
                  <Camera className="h-4 w-4" />
                  <AlertTitle>Error de Cámara</AlertTitle>
                  <AlertDescription>
                    No se pudo acceder a la cámara. Verifique los permisos en su navegador.
                  </AlertDescription>
                </Alert>
              )}
              <div className="flex flex-col sm:flex-row gap-2 mt-2">
                <Button type="button" variant="outline" onClick={handleToggleCamera} className="flex-1">
                  <Camera className="mr-2" /> {isCameraOpen ? "Cerrar Cámara" : "Abrir Cámara"}
                </Button>
                {isCameraOpen && (
                  <Button type="button" onClick={handleCaptureFromStream} className="flex-1">
                    Capturar Foto
                  </Button>
                )}
              </div>
              <Input 
                type="file" 
                accept="image/*" 
                ref={photoInputRef} 
                onChange={handlePhotoInputChange} 
                className="hidden" 
                id="photo-upload-input"
              />
              <Button type="button" variant="outline" onClick={() => photoInputRef.current?.click()} className="w-full">
                <FileImage className="mr-2" /> Subir Foto Existente
              </Button>
               <FormField
                control={form.control}
                name="photoDataUri"
                render={({ field }) => ( <FormItem className="hidden"> <FormControl><Input {...field} /></FormControl> </FormItem> )}
              />
            </div>

            {/* Columna de Escaneo con Lector Físico (Condicional) */}
            {showScannerSection && (
              <div className="space-y-4">
                <FormLabel htmlFor="rawScannedData">Datos de Cédula (Lector Físico)</FormLabel>
                <Input
                  id="rawScannedData"
                  placeholder="Esperando datos del lector..."
                  value={rawScannedDataInput}
                  onChange={(e) => setRawScannedDataInput(e.target.value)}
                  aria-describedby="scan-helper-text"
                />
                <FormDescription id="scan-helper-text">
                  Use su lector de códigos de barras físico para escanear la cédula. Los datos aparecerán aquí.
                  Para simulación, ingrese: <code className="bg-muted p-1 rounded">SCAN_LUISA_GOMEZ</code>
                </FormDescription>
                <Button type="button" onClick={handleProcessScannedData} disabled={isProcessingScan || !rawScannedDataInput} className="w-full">
                  {isProcessingScan ? <Loader2 className="mr-2 animate-spin" /> : <ScanLine className="mr-2" />}
                  Procesar Datos Escaneados
                </Button>
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Información Importante</AlertTitle>
                  <AlertDescription>
                    Esta función simula el autocompletado a partir de datos que un lector físico de códigos de barras (PDF417) ingresaría en el campo de arriba.
                    La decodificación real del formato PDF417 no está implementada en este prototipo.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </CardContent>
        </Card>

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
                    onChange={(value) => { field.onChange(value); form.trigger('tipodocumento'); }}
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
                    onChange={(value) => { field.onChange(value); form.trigger('genero'); }}
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
                            format(new Date(field.value), "PPP", { locale: es }) // Asegurarse que field.value es Date
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
                    onChange={(value) => { field.onChange(value); form.trigger('rh'); }}
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
                    onChange={(value) => { field.onChange(value); form.trigger('tipovisita'); }}
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
                    onChange={(value) => { field.onChange(value); form.trigger('arl'); }}
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
                    onChange={(value) => { field.onChange(value); form.trigger('eps'); }}
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

