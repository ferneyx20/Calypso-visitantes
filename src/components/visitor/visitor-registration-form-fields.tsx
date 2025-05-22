"use client";

import { useFormContext } from "react-hook-form"; 
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { FullVisitorFormData } from "./visitor-registration-form";
import React, { useState, useRef, useEffect } from "react"; // useCallback no se usa directamente aquí
import Image from 'next/image';

import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea"; // No se usa Textarea aquí
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // CardDescription no se usa
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox"; // Asegúrate que ComboboxOption se exporte de tu combobox.tsx
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { CalendarIcon, UserCheck, Camera, FileImage, ScanLine, UserSquare2, Info, Loader2 } from "lucide-react";
// import { Badge } from "@/components/ui/badge"; // Badge no se usa aquí
import { cn } from "@/lib/utils";
// import { ScrollArea } from "../ui/scroll-area"; // ScrollArea no se usa directamente aquí, está en el padre
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


// Opciones para ID Interno (lista fija)
const idInternoOptionsList = Array.from({ length: 20 }, (_, i) => String(i + 1));

export interface VisitorFormFieldsProps {
  tiposDeDocumentoOptions: string[];
  generosOptions: string[];
  factoresRHOptions: string[];
  tiposDeVisitaOptions: string[];
  arlOptions: string[];
  epsOptions: string[];
  parentescosOptions: string[];
  // idInternoOptions: string[]; // Ya no se pasa como prop, se usa idInternoOptionsList
  employeeComboboxOptions: ComboboxOption[];
  showScannerSection?: boolean;
  isAutoregistro?: boolean;
}

export function VisitorRegistrationFormFields({
  tiposDeDocumentoOptions,
  generosOptions,
  factoresRHOptions,
  tiposDeVisitaOptions,
  arlOptions,
  epsOptions,
  parentescosOptions,
  // idInternoOptions, // Se usa la lista local
  employeeComboboxOptions,
  showScannerSection = true,
  isAutoregistro = false,
}: VisitorFormFieldsProps) {
  const { toast } = useToast();
  const form = useFormContext<FullVisitorFormData>(); 
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const photoDataUriFromForm = form.watch('photoDataUri'); // Observar el valor del formulario
  const [capturedPhotoDataUri, setCapturedPhotoDataUri] = useState<string | null>(photoDataUriFromForm || null);
  
  const [rawScannedDataInput, setRawScannedDataInput] = useState("");
  const [isProcessingScan, setIsProcessingScan] = useState(false);

  // Sincronizar el estado local de la foto con el valor del formulario
  useEffect(() => {
    setCapturedPhotoDataUri(photoDataUriFromForm || null);
  }, [photoDataUriFromForm]);


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
        // setCapturedPhotoDataUri(dataUri); // El useEffect que observa photoDataUriFromForm lo hará
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
        // setCapturedPhotoDataUri(dataUri); // El useEffect lo hará
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
          tipodocumento: 'Cédula de Ciudadanía'
        };

        form.setValue('numerodocumento', mockCedulaData.numerodocumento, { shouldValidate: true });
        form.setValue('nombres', mockCedulaData.nombres, { shouldValidate: true });
        form.setValue('apellidos', mockCedulaData.apellidos, { shouldValidate: true });
        form.setValue('genero', mockCedulaData.genero, { shouldValidate: true });
        form.setValue('fechanacimiento', mockCedulaData.fechanacimiento, { shouldValidate: true });
        form.setValue('rh', mockCedulaData.rh, { shouldValidate: true });
        
        if (!form.getValues('tipodocumento') && tiposDeDocumentoOptions.includes(mockCedulaData.tipodocumento)) {
            form.setValue('tipodocumento', mockCedulaData.tipodocumento, { shouldValidate: true });
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
    <>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <Card>
        <CardHeader><CardTitle className="text-lg">{showScannerSection ? "Identificación Visual y por Lector" : "Identificación Visual"}</CardTitle></CardHeader>
        <CardContent className={cn("grid gap-6 items-start",showScannerSection ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1")}>
          <div className="space-y-3">
            <FormLabel>Fotografía del Visitante</FormLabel>
            <div className="w-full aspect-square bg-muted rounded-md flex items-center justify-center overflow-hidden border">
              {capturedPhotoDataUri ? (<Image src={capturedPhotoDataUri} alt="Foto del visitante" width={200} height={200} className="object-cover w-full h-full" />) : (<UserSquare2 className="w-24 h-24 text-muted-foreground" />)}
            </div>
            {isCameraOpen && hasCameraPermission !== false && (<div className="w-full aspect-video bg-black rounded-md overflow-hidden mt-2"><video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted /></div>)}
            {hasCameraPermission === false && !isCameraOpen && (<Alert variant="destructive" className="mt-2"><Camera className="h-4 w-4" /><AlertTitle>Error de Cámara</AlertTitle><AlertDescription>No se pudo acceder a la cámara.</AlertDescription></Alert>)}
            <div className="flex flex-col sm:flex-row gap-2 mt-2">
              <Button type="button" variant="outline" onClick={handleToggleCamera} className="flex-1"><Camera className="mr-2 h-4 w-4" /> {isCameraOpen ? "Cerrar" : "Abrir"} Cámara</Button>
              {isCameraOpen && (<Button type="button" onClick={handleCaptureFromStream} className="flex-1">Capturar Foto</Button>)}
            </div>
            <Input type="file" accept="image/*" ref={photoInputRef} onChange={handlePhotoInputChange} className="hidden" id="photo-upload-input"/>
            <Button type="button" variant="outline" onClick={() => photoInputRef.current?.click()} className="w-full"><FileImage className="mr-2 h-4 w-4" /> Subir Foto</Button>
            <FormField control={form.control} name="photoDataUri" render={({ field }) => ( <FormItem className="hidden"><FormControl><Input {...field} value={field.value || ""} /></FormControl></FormItem> )}/>
          </div>
          {showScannerSection && (
            <div className="space-y-4">
              <FormLabel htmlFor="rawScannedData">Datos de Cédula (Lector Físico)</FormLabel>
              <Input id="rawScannedData" placeholder="Esperando datos del lector..." value={rawScannedDataInput} onChange={(e) => setRawScannedDataInput(e.target.value)} aria-describedby="scan-helper-text"/>
              <FormDescription id="scan-helper-text">Simulación: <code className="bg-muted p-1 rounded">SCAN_LUISA_GOMEZ</code></FormDescription>
              <Button type="button" onClick={handleProcessScannedData} disabled={isProcessingScan || !rawScannedDataInput} className="w-full">{isProcessingScan ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ScanLine className="mr-2 h-4 w-4" />} Procesar Datos</Button>
              <Alert><Info className="h-4 w-4" /><AlertTitle>Info</AlertTitle><AlertDescription>Simulación de autocompletado por lector.</AlertDescription></Alert>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Información Personal del Visitante</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField control={form.control} name="tipodocumento" render={({ field }) => (<FormItem><FormLabel>Tipo de Documento</FormLabel><Combobox options={tiposDeDocumentoOptions} value={field.value || ""} onChange={(value) => field.onChange(value)} placeholder="Seleccione tipo" disabled={field.disabled} emptyMessage="Tipo no encontrado." searchPlaceholder="Buscar tipo..."/><FormMessage /></FormItem>)}/>
          <FormField control={form.control} name="numerodocumento" render={({ field }) => ( <FormItem><FormLabel>Número de Documento</FormLabel><FormControl><Input placeholder="Ej: 123456789" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem> )} />
          <FormField control={form.control} name="nombres" render={({ field }) => ( <FormItem><FormLabel>Nombres</FormLabel><FormControl><Input placeholder="Ej: Ana María" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem> )} />
          <FormField control={form.control} name="apellidos" render={({ field }) => ( <FormItem><FormLabel>Apellidos</FormLabel><FormControl><Input placeholder="Ej: Pérez Gómez" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem> )} />
          <FormField control={form.control} name="genero" render={({ field }) => (<FormItem><FormLabel>Género</FormLabel><Combobox options={generosOptions} value={field.value || ""} onChange={(value) => field.onChange(value)} placeholder="Seleccione género" disabled={field.disabled} emptyMessage="Género no encontrado." searchPlaceholder="Buscar género..."/><FormMessage /></FormItem>)}/>
          <FormField control={form.control} name="fechanacimiento" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel className="mb-1.5">Fecha de Nacimiento</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal",!field.value && "text-muted-foreground")} disabled={field.disabled}>{field.value ? (format(new Date(field.value), "PPP", { locale: es })) : (<span>Seleccione fecha</span>)}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value ? new Date(field.value) : undefined} onSelect={(date) => field.onChange(date)} disabled={(date) =>date > new Date() || date < new Date("1900-01-01")} initialFocus locale={es}/></PopoverContent></Popover><FormMessage /></FormItem>)}/>
          <FormField control={form.control} name="rh" render={({ field }) => (<FormItem><FormLabel>RH</FormLabel><Combobox options={factoresRHOptions} value={field.value || ""} onChange={(value) => field.onChange(value)} placeholder="Seleccione RH" disabled={field.disabled} emptyMessage="RH no encontrado." searchPlaceholder="Buscar RH..."/><FormMessage /></FormItem>)}/>
          <FormField control={form.control} name="telefono" render={({ field }) => ( <FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input type="tel" placeholder="Ej: 3001234567" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem> )} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Detalles de la Visita</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {!isAutoregistro && (
            <FormField control={form.control} name="personavisitadaId" render={({ field }) => (
                <FormItem className="md:col-span-2"> 
                <FormLabel>Persona a Visitar (Anfitrión)</FormLabel>
                <Combobox
                    options={employeeComboboxOptions}
                    value={field.value || ""} 
                    onChange={(value) => field.onChange(value === "" ? null : value)} // Enviar null si es ""
                    getOptionLabel={(option) => (option as ComboboxOption).label} // Asegurar el tipo
                    getOptionValue={(option) => (option as ComboboxOption).value} // Asegurar el tipo
                    placeholder="Buscar empleado..."
                    searchPlaceholder="Escriba nombre o ID..."
                    emptyMessage="Empleado no encontrado."
                    disabled={field.disabled}
                    icon={<UserCheck className="mr-2 h-4 w-4 text-primary" />}
                />
                <FormMessage />
                </FormItem>
            )}/>
          )}
          <FormField control={form.control} name="tipovisita" render={({ field }) => (
              <FormItem className={isAutoregistro ? "md:col-span-2" : ""}>
                <FormLabel>Tipo de Visita</FormLabel>
                <Combobox options={tiposDeVisitaOptions} value={field.value || ""} onChange={(value) => field.onChange(value)} placeholder="Seleccione tipo" disabled={field.disabled} emptyMessage="Tipo no encontrado." searchPlaceholder="Buscar tipo..." />
                <FormMessage />
              </FormItem>
            )}/>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader><CardTitle className="text-lg">Información Adicional (Opcional)</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField control={form.control} name="empresaProviene" render={({ field }) => ( <FormItem><FormLabel>Empresa de Origen</FormLabel><FormControl><Input placeholder="Ej: Acme Corp" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem> )} />
            <FormField
              control={form.control}
              name="numerocarnet"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Numero Carnet Interno</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === "NO_APLICA_ID_INTERNO" ? null : value)}
                    value={field.value || ""}
                    disabled={field.disabled}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="ID (1-20)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="NO_APLICA_ID_INTERNO"><em>Ninguno / No Aplica</em></SelectItem> 
                      {idInternoOptionsList.map(option => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField control={form.control} name="vehiculoPlaca" render={({ field }) => ( <FormItem className="md:col-span-2"><FormLabel>Placa del Vehículo</FormLabel><FormControl><Input placeholder="Ej: XYZ123" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem> )} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Salud y Seguridad</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField control={form.control} name="arl" render={({ field }) => ( <FormItem><FormLabel>ARL</FormLabel><Combobox options={arlOptions} value={field.value || ""} onChange={(value) => field.onChange(value)} placeholder="Seleccione ARL" disabled={field.disabled} emptyMessage="ARL no encontrada." searchPlaceholder="Buscar ARL..."/><FormMessage /></FormItem> )}/>
            <FormField control={form.control} name="eps" render={({ field }) => ( <FormItem><FormLabel>EPS</FormLabel><Combobox options={epsOptions} value={field.value || ""} onChange={(value) => field.onChange(value)} placeholder="Seleccione EPS" disabled={field.disabled} emptyMessage="EPS no encontrada." searchPlaceholder="Buscar EPS..."/><FormMessage /></FormItem> )}/>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Contacto de Emergencia</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField control={form.control} name="contactoemergencianombre" render={({ field }) => ( <FormItem><FormLabel>Nombres</FormLabel><FormControl><Input placeholder="Ej: Carlos" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="contactoemergenciaapellido" render={({ field }) => ( <FormItem><FormLabel>Apellidos</FormLabel><FormControl><Input placeholder="Ej: Rodríguez" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="contactoemergenciatelefono" render={({ field }) => ( <FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input type="tel" placeholder="Ej: 3109876543" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="contactoemergenciaparentesco" render={({ field }) => ( <FormItem><FormLabel>Parentesco</FormLabel><Combobox options={parentescosOptions} value={field.value || ""} onChange={(value) => field.onChange(value)} placeholder="Seleccione parentesco" disabled={field.disabled} emptyMessage="Parentesco no encontrado." searchPlaceholder="Buscar parentesco..."/><FormMessage /></FormItem> )}/>
        </CardContent>
      </Card>
    </>
  );
}