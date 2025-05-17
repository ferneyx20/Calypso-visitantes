
"use client";

import { useState, type ChangeEvent, useEffect, useMemo } from 'react';
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { UsersRound, Upload, FileText, Loader2, Plus, UserPlus, Search } from "lucide-react"; // Added Search icon
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const employeeSchema = z.object({
  id: z.string().optional(),
  identificacion: z.string().min(5, { message: "La identificación debe tener al menos 5 caracteres." }),
  nombreApellido: z.string().min(3, { message: "El nombre y apellido debe tener al menos 3 caracteres." }),
  cargo: z.string().min(3, { message: "El cargo debe tener al menos 3 caracteres." }),
  sede: z.string().min(1, { message: "Debe seleccionar una sede." }),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

interface Sede {
  id: string;
  name: string;
}

const SIMULATED_SEDES: Sede[] = [
  { id: "sede-norte", name: "Sede Norte" },
  { id: "sede-sur", name: "Sede Sur" },
  { id: "sede-centro", name: "Sede Centro" },
  { id: "sede-principal", name: "Sede Principal" },
];

export default function EmployeesPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAddEmployeeDialogOpen, setIsAddEmployeeDialogOpen] = useState(false);
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  const [employeesList, setEmployeesList] = useState<EmployeeFormData[]>([]);
  const [availableSedes, setAvailableSedes] = useState<Sede[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    setAvailableSedes(SIMULATED_SEDES);
  }, []);

  const manualForm = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      identificacion: "",
      nombreApellido: "",
      cargo: "",
      sede: "",
    }
  });

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.type === "text/csv") {
        setSelectedFile(file);
      } else {
        toast({
          title: "Archivo no válido",
          description: "Por favor, seleccione un archivo CSV.",
          variant: "destructive",
        });
        setSelectedFile(null);
        event.target.value = "";
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "Sin archivo",
        description: "Por favor, seleccione un archivo CSV para cargar.",
        variant: "destructive",
      });
      return;
    }
    setIsUploading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsUploading(false);
    toast({
      title: "Carga Exitosa (Simulada)",
      description: `El archivo ${selectedFile.name} ha sido procesado.`,
    });
    setSelectedFile(null);
    const fileInput = document.getElementById('csv-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const onManualSubmit: SubmitHandler<EmployeeFormData> = async (data) => {
    setIsSubmittingManual(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newEmployee = { ...data, id: `emp-${Date.now()}` };
    setEmployeesList(prev => [...prev, newEmployee]);

    toast({
      title: "Empleado Agregado",
      description: `El empleado "${data.nombreApellido}" ha sido agregado exitosamente.`,
    });
    setIsSubmittingManual(false);
    setIsAddEmployeeDialogOpen(false);
    manualForm.reset();
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value.toLowerCase());
  };

  const filteredEmployees = useMemo(() => {
    if (!searchTerm) return employeesList;
    return employeesList.filter(
      emp =>
        emp.nombreApellido.toLowerCase().includes(searchTerm) ||
        emp.identificacion.includes(searchTerm)
    );
  }, [employeesList, searchTerm]);

  return (
    <div className="w-full flex flex-col flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold flex items-center">
          <UsersRound className="mr-3 h-8 w-8 text-primary" />
          Gestión de Empleados
        </h1>
        <Dialog open={isAddEmployeeDialogOpen} onOpenChange={setIsAddEmployeeDialogOpen}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Empleado
                  </Button>
                </DialogTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Agregar Nuevo Empleado Manualmente</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <UserPlus className="mr-2 h-5 w-5 text-primary" />
                Agregar Nuevo Empleado
              </DialogTitle>
              <DialogDescription>
                Complete los detalles del nuevo empleado a continuación.
              </DialogDescription>
            </DialogHeader>
            <Form {...manualForm}>
              <form onSubmit={manualForm.handleSubmit(onManualSubmit)} className="space-y-4">
                <FormField
                  control={manualForm.control}
                  name="identificacion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Identificación</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: 123456789" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={manualForm.control}
                  name="nombreApellido"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre y Apellido</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Carlos López" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={manualForm.control}
                  name="cargo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cargo</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Desarrollador Frontend" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={manualForm.control}
                  name="sede"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sede</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione una sede" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableSedes.map((sede) => (
                            <SelectItem key={sede.id} value={sede.name}>
                              {sede.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline" disabled={isSubmittingManual}>
                      Cancelar
                    </Button>
                  </DialogClose>
                  <Button type="submit" disabled={isSubmittingManual}>
                    {isSubmittingManual ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      "Guardar Empleado"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-lg flex flex-col flex-1">
        <CardHeader>
          <CardTitle>Lista de Empleados</CardTitle>
          <CardDescription>
            Aquí se mostrará la tabla con los empleados registrados. Puede buscar por nombre o identificación.
          </CardDescription>
          <div className="flex items-center gap-2 pt-4">
            <Search className="h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por nombre o identificación..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-0 flex flex-col flex-1">
           {employeesList.length === 0 ? (
            <div className="mt-4 flex flex-1 items-center justify-center border-2 border-dashed border-border rounded-lg bg-card">
              <p className="text-muted-foreground">No hay empleados registrados aún.</p>
            </div>
           ) : filteredEmployees.length === 0 ? (
            <div className="mt-4 flex flex-1 items-center justify-center border-2 border-dashed border-border rounded-lg bg-card">
              <p className="text-muted-foreground">No se encontraron empleados que coincidan con su búsqueda.</p>
            </div>
           ) : (
            <div className="mt-4 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Identificación</TableHead>
                    <TableHead>Nombre y Apellido</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Sede</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>{employee.identificacion}</TableCell>
                      <TableCell className="font-medium">{employee.nombreApellido}</TableCell>
                      <TableCell>{employee.cargo}</TableCell>
                      <TableCell>{employee.sede}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Cargar Empleados desde CSV</CardTitle>
          <CardDescription>
            Seleccione un archivo CSV para importar la lista de empleados.
            El archivo debe tener las siguientes columnas en este orden:
            <code className="block bg-muted p-2 rounded-md my-2 text-sm">
              identificacion,nombre y apellido,cargo,sede
            </code>
             Asegúrese de que la primera fila contenga estas cabeceras.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="csv-upload" className="text-base">Seleccionar archivo CSV</Label>
            <div className="mt-2 flex items-center gap-3">
              <Input
                id="csv-upload"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="max-w-md file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              />
            </div>
          </div>
          {selectedFile && (
            <div className="p-3 bg-muted/50 rounded-md border border-border">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <FileText className="h-5 w-5 text-primary" />
                <span>{selectedFile.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </span>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={handleUpload} disabled={!selectedFile || isUploading}>
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cargando...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Cargar y Procesar CSV
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

    </div>
  );
}
