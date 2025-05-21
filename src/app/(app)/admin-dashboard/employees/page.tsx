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
import { UsersRound, Upload, FileText, Loader2, Plus, UserPlus, Search, Pencil, Trash2, CheckCircle, AlertTriangle, Info } from "lucide-react"; // Agregado AlertTriangle, Info
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"; // AlertDialogTrigger no se usa directamente en la tabla ahora
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { notify } from "@/components/layout/app-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Para mostrar resultados del CSV

const employeeFormSchema = z.object({
  id: z.string().optional(),
  identificacion: z.string().min(5, { message: "La identificación debe tener al menos 5 caracteres." }),
  nombreApellido: z.string().min(3, { message: "El nombre y apellido debe tener al menos 3 caracteres." }),
  cargo: z.string().min(3, { message: "El cargo debe tener al menos 3 caracteres." }),
  sedeId: z.string().min(1, { message: "Debe seleccionar una sede." }),
});

type EmployeeFormData = z.infer<typeof employeeFormSchema>;

interface Sede {
  id: string;
  name: string;
}

interface EmployeeFromAPI extends EmployeeFormData {
  id: string;
  sede?: { name: string };
  createdAt?: Date;
  updatedAt?: Date;
}

// NUEVO: Interfaz para la respuesta del backend al subir CSV
interface CSVUploadResponse {
  message: string;
  successCount: number;
  errorCount: number;
  errors: Array<{ row: number; identificacion?: string; error: string }>;
  createdEmployees?: Partial<EmployeeFromAPI>[]; // Opcional: para actualizar la lista
}


export default function EmployeesPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<CSVUploadResponse | null>(null); // NUEVO: Estado para resultado de carga
  const [isAddEmployeeDialogOpen, setIsAddEmployeeDialogOpen] = useState(false);
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);

  const [employeesList, setEmployeesList] = useState<EmployeeFromAPI[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);
  const [availableSedes, setAvailableSedes] = useState<Sede[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const [editingEmployee, setEditingEmployee] = useState<EmployeeFromAPI | null>(null);
  const [employeeToDelete, setEmployeeToDelete] = useState<EmployeeFromAPI | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);

  const manualForm = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      identificacion: "",
      nombreApellido: "",
      cargo: "",
      sedeId: "",
    }
  });

  const fetchEmployees = async () => {
    setIsLoadingEmployees(true);
    try {
      const response = await fetch('/api/empleados');
      if (!response.ok) throw new Error('Error al cargar empleados');
      const data: EmployeeFromAPI[] = await response.json();
      setEmployeesList(data);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: (error as Error).message });
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  const fetchSedes = async () => {
    try {
      const response = await fetch('/api/sedes');
      if (!response.ok) throw new Error('Error al cargar sedes');
      const data: Sede[] = await response.json();
      setAvailableSedes(data);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar las sedes para el formulario." });
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchSedes();
  }, []);


  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setUploadResult(null); // Limpiar resultados anteriores al seleccionar nuevo archivo
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.type === "text/csv" || file.name.endsWith('.csv')) { // Aceptar text/csv o por extensión
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
        variant: "warning", // Cambiado a warning
      });
      return;
    }
    setIsUploading(true);
    setUploadResult(null); // Limpiar resultados anteriores
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('/api/empleados/upload-csv', { // NUEVO ENDPOINT
        method: 'POST',
        body: formData,
        // No establecer 'Content-Type': 'multipart/form-data' manualmente,
        // el navegador lo hace automáticamente con FormData y añade el boundary correcto.
      });

      const result: CSVUploadResponse = await response.json();
      setUploadResult(result); // Guardar el resultado completo

      if (!response.ok && response.status !== 207) { // 207 es Multi-Status (éxitos parciales)
        throw new Error(result.message || 'Error desconocido al procesar el CSV.');
      }

      if (result.successCount > 0) {
        toast({
          title: "Procesamiento CSV Finalizado",
          description: `${result.successCount} empleado(s) creado(s)/actualizado(s) exitosamente. ${result.errorCount > 0 ? `${result.errorCount} con errores.` : ''}`,
          variant: result.errorCount > 0 ? "default" : "success", // default (azul) si hay errores, success si no
          duration: 7000,
        });
        fetchEmployees(); // Recargar la lista de empleados
        notify.new({
          icon: <CheckCircle className="h-5 w-5 text-green-500" />,
          title: "Carga CSV Exitosa",
          description: `${result.successCount} empleado(s) importado(s).`,
          type: 'employee_created', // o un nuevo tipo 'csv_upload_success'
          read: false
        });
      } else if (result.errorCount > 0) {
         toast({
          title: "Procesamiento CSV con Errores",
          description: `No se crearon empleados. Se encontraron ${result.errorCount} errores. Revise los detalles.`,
          variant: "destructive",
          duration: 7000,
        });
      } else { // Ni success ni errores, mensaje genérico
         toast({
          title: "Procesamiento CSV",
          description: result.message || "El archivo fue procesado.",
          duration: 5000,
        });
      }

    } catch (error) {
      console.error("Error al subir CSV:", error);
      const errorMessage = (error instanceof Error) ? error.message : "Ocurrió un error inesperado.";
      setUploadResult({ // Para mostrar el error en la UI
        message: `Error en la carga: ${errorMessage}`,
        successCount: 0,
        errorCount: selectedFile ? 1 : 0, // Asumir 1 error si hubo un archivo
        errors: [{ row: 0, error: errorMessage }],
      });
      toast({
        title: "Error en Carga de CSV",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Mantener el archivo seleccionado para que el usuario vea el nombre,
      // pero limpiar el input para permitir reseleccionar el mismo archivo si es necesario.
      const fileInput = document.getElementById('csv-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = ""; // Permite volver a seleccionar el mismo archivo
      // No limpiar selectedFile aquí para que se pueda ver el nombre y el resultado asociado a él.
      // setSelectedFile(null);
    }
  };

  // ... (resto de los handlers: handleOpenFormDialog, onManualSubmit, etc. permanecen igual)
  const handleOpenFormDialog = (employee?: EmployeeFromAPI) => {
    if (employee) {
      setEditingEmployee(employee);
      manualForm.reset({
        id: employee.id,
        identificacion: employee.identificacion,
        nombreApellido: employee.nombreApellido,
        cargo: employee.cargo,
        sedeId: employee.sedeId,
      });
    } else {
      setEditingEmployee(null);
      manualForm.reset({ identificacion: "", nombreApellido: "", cargo: "", sedeId: "", id: undefined });
    }
    setIsAddEmployeeDialogOpen(true);
  };

  const onManualSubmit: SubmitHandler<EmployeeFormData> = async (data) => {
    setIsSubmittingManual(true);
    try {
      let response;
      let notificationTitle = "";
      let notificationDescription = "";

      if (editingEmployee) {
        response = await fetch(`/api/empleados/${editingEmployee.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        notificationTitle = "Empleado Actualizado";
        notificationDescription = `El empleado ${data.nombreApellido} fue actualizado.`;
      } else {
        response = await fetch('/api/empleados', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        notificationTitle = "Nuevo Empleado Creado";
        notificationDescription = `Se creó el empleado ${data.nombreApellido}.`;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || (editingEmployee ? 'Error al actualizar empleado' : 'Error al agregar empleado'));
      }
      
      toast({
        title: editingEmployee ? "Empleado Actualizado" : "Empleado Agregado",
        description: `El empleado "${data.nombreApellido}" ha sido ${editingEmployee ? 'actualizado' : 'agregado'} exitosamente.`,
      });
      
      notify.new({
        icon: <UserPlus className="h-5 w-5 text-green-500" />,
        title: notificationTitle,
        description: notificationDescription,
        type: 'employee_created',
        read: false
      });

      fetchEmployees(); 
      setIsAddEmployeeDialogOpen(false);
      setEditingEmployee(null);
      manualForm.reset({ identificacion: "", nombreApellido: "", cargo: "", sedeId: "", id: undefined });

    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: (error as Error).message });
    } finally {
      setIsSubmittingManual(false);
    }
  };

  const handleDeleteClick = (employee: EmployeeFromAPI) => {
    setEmployeeToDelete(employee);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!employeeToDelete) return;
    try {
      const response = await fetch(`/api/empleados/${employeeToDelete.id}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al eliminar empleado');
      }
      toast({
        title: "Empleado Eliminado",
        description: `El empleado "${employeeToDelete.nombreApellido}" ha sido eliminado.`,
        variant: "destructive"
      });
       notify.new({
        icon: <Trash2 className="h-5 w-5 text-red-500" />,
        title: "Empleado Eliminado",
        description: `El empleado ${employeeToDelete.nombreApellido} fue eliminado.`,
        type: 'user_updated', 
        read: false
      });
      fetchEmployees(); 
      setEmployeeToDelete(null);
    } catch (error) {
       toast({ variant: "destructive", title: "Error al eliminar", description: (error as Error).message });
    }
    setIsDeleteDialogOpen(false);
  };
  
  const confirmBatchDelete = async () => {
    if (selectedEmployeeIds.length === 0) return;
    setIsBatchDeleting(true);
    try {
      const response = await fetch('/api/empleados/batch-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedEmployeeIds }),
      });
      const result = await response.json();
      if (!response.ok && response.status !== 207) { 
        throw new Error(result.message || 'Error al eliminar empleados seleccionados');
      }

      if (response.status === 207) { 
         toast({ title: "Resultado de Eliminación", description: result.message, duration: 7000 });
      } else {
         toast({ title: "Empleados Eliminados", description: result.message, variant: "destructive"});
      }
      
      if (result.deletedCount && result.deletedCount > 0) {
        notify.new({
            icon: <Trash2 className="h-5 w-5 text-red-500" />,
            title: "Empleados Eliminados (Lote)",
            description: `${result.deletedCount} empleado(s) fueron eliminados.`,
            type: 'user_updated',
            read: false
        });
      }

      fetchEmployees();
      setSelectedEmployeeIds([]);
    } catch (error) {
      toast({ variant: "destructive", title: "Error al eliminar", description: (error as Error).message });
    } finally {
      setIsBatchDeleting(false);
    }
  };

  const handleSelectAll = (checked: boolean | "indeterminate") => {
    if (checked === true) {
      setSelectedEmployeeIds(filteredEmployees.map(emp => emp.id!));
    } else {
      setSelectedEmployeeIds([]);
    }
  };

  const handleRowSelect = (employeeId: string, checked: boolean | "indeterminate") => {
    if (checked === true) {
      setSelectedEmployeeIds(prev => [...prev, employeeId]);
    } else {
      setSelectedEmployeeIds(prev => prev.filter(id => id !== employeeId));
    }
  };
  
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value.toLowerCase());
  };

  const filteredEmployees = useMemo(() => {
    if (!searchTerm) return employeesList;
    return employeesList.filter(
      emp =>
        emp.nombreApellido.toLowerCase().includes(searchTerm) ||
        emp.identificacion.includes(searchTerm) ||
        emp.cargo.toLowerCase().includes(searchTerm) ||
        (emp.sede?.name || '').toLowerCase().includes(searchTerm)
    );
  }, [employeesList, searchTerm]);

  const isAllSelected = filteredEmployees.length > 0 && selectedEmployeeIds.length === filteredEmployees.length;
  const isSomeSelected = selectedEmployeeIds.length > 0 && selectedEmployeeIds.length < filteredEmployees.length;


  return (
    <div className="w-full flex flex-col flex-1 space-y-6">
      {/* ... (Título y botón Agregar Empleado igual que antes) ... */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold flex items-center">
          <UsersRound className="mr-3 h-8 w-8 text-primary" />
          Gestión de Empleados
        </h1>
        <Dialog open={isAddEmployeeDialogOpen} onOpenChange={(isOpen) => {
            setIsAddEmployeeDialogOpen(isOpen);
            if (!isOpen) {
                setEditingEmployee(null);
                manualForm.reset({ identificacion: "", nombreApellido: "", cargo: "", sedeId: "", id: undefined });
            }
        }}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" onClick={() => handleOpenFormDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Empleado
                </Button>
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
                {editingEmployee ? "Editar Empleado" : "Agregar Nuevo Empleado"}
              </DialogTitle>
              <DialogDescription>
                {editingEmployee ? "Modifique los detalles del empleado." : "Complete los detalles del nuevo empleado."}
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
                  name="sedeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sede</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione una sede" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableSedes.length > 0 ? availableSedes.map((sede) => (
                            <SelectItem key={sede.id} value={sede.id}>
                              {sede.name}
                            </SelectItem>
                          )) : <SelectItem value="loading" disabled>Cargando sedes...</SelectItem>}
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
                        {editingEmployee ? "Actualizando..." : "Guardando..."}
                      </>
                    ) : (
                      editingEmployee ? "Actualizar Empleado" : "Guardar Empleado"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* ... (Sección de eliminación en lote igual que antes) ... */}
      {selectedEmployeeIds.length > 0 && (
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md border">
            <span className="text-sm text-muted-foreground">{selectedEmployeeIds.length} empleado(s) seleccionado(s)</span>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" disabled={isBatchDeleting}>
                        {isBatchDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Trash2 className="mr-2 h-4 w-4"/>}
                        Eliminar Seleccionados
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta acción eliminará permanentemente {selectedEmployeeIds.length} empleado(s) seleccionado(s). Esta acción no se puede deshacer.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={confirmBatchDelete}
                        className={selectedEmployeeIds.length > 0 ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
                        disabled={selectedEmployeeIds.length === 0 || isBatchDeleting}
                    >
                        {isBatchDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : "Eliminar"}
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
      )}

      {/* ... (Tabla de empleados igual que antes) ... */}
      <Card className="shadow-lg flex flex-col flex-1 w-full">
        <CardHeader>
          <CardTitle>Lista de Empleados</CardTitle>
          <CardDescription>
            Aquí se mostrará la tabla con los empleados registrados. Puede buscar, editar o eliminar empleados.
          </CardDescription>
          <div className="flex items-center gap-2 pt-4">
            <Search className="h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por nombre, identificación, cargo o sede..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-0 flex flex-col flex-1">
           {isLoadingEmployees ? (
             <div className="mt-4 flex flex-1 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
           ) :employeesList.length === 0 && !searchTerm ? (
            <div className="mt-4 flex flex-1 items-center justify-center border-2 border-dashed border-border rounded-lg bg-card">
              <p className="text-muted-foreground">No hay empleados registrados aún.</p>
            </div>
           ) : filteredEmployees.length === 0 && searchTerm ? (
            <div className="mt-4 flex flex-1 items-center justify-center border-2 border-dashed border-border rounded-lg bg-card">
              <p className="text-muted-foreground">No se encontraron empleados que coincidan con su búsqueda.</p>
            </div>
           ) : (
            <div className="mt-4 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={isAllSelected || (isSomeSelected && 'indeterminate')}
                        onCheckedChange={handleSelectAll}
                        aria-label="Seleccionar todos los empleados"
                        disabled={filteredEmployees.length === 0}
                      />
                    </TableHead>
                    <TableHead>Identificación</TableHead>
                    <TableHead>Nombre y Apellido</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Sede</TableHead>
                    <TableHead className="text-right w-[120px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.slice(0, selectedEmployeeIds.length > 0 ? filteredEmployees.length : 5).map((employee) => (
                    <TableRow key={employee.id} data-state={selectedEmployeeIds.includes(employee.id!) ? "selected" : ""}>
                      <TableCell>
                        <Checkbox
                          checked={selectedEmployeeIds.includes(employee.id!)}
                          onCheckedChange={(checked) => handleRowSelect(employee.id!, checked)}
                          aria-label={`Seleccionar empleado ${employee.nombreApellido}`}
                        />
                      </TableCell>
                      <TableCell>{employee.identificacion}</TableCell>
                      <TableCell className="font-medium">{employee.nombreApellido}</TableCell>
                      <TableCell>{employee.cargo}</TableCell>
                      <TableCell>{employee.sede?.name || employee.sedeId}</TableCell>
                      <TableCell className="text-right">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={() => handleOpenFormDialog(employee)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Editar Empleado</p></TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(employee)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Eliminar Empleado</p></TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredEmployees.length > 5 && selectedEmployeeIds.length === 0 && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Mostrando 5 de {filteredEmployees.length} empleados. Refine su búsqueda o seleccione empleados para ver todos los seleccionados.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sección de Carga de CSV MODIFICADA */}
      <Card className="shadow-lg w-full">
        <CardHeader>
          <CardTitle>Cargar Empleados desde CSV</CardTitle>
          <CardDescription>
            Seleccione un archivo CSV para importar la lista de empleados.
            El archivo debe tener las siguientes columnas en este orden:
            <code className="block bg-muted p-2 rounded-md my-2 text-sm">
              identificacion,nombre y apellido,cargo,nombre_sede {/* MODIFICADO: nombre_sede */}
            </code>
             Asegúrese de que la primera fila contenga estas cabeceras y que <code className="text-xs bg-muted p-0.5 rounded">nombre_sede</code> corresponda a un nombre de sede existente y escrito exactamente igual.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="csv-upload" className="text-base">Seleccionar archivo CSV</Label>
            <div className="mt-2 flex items-center gap-3">
              <Input
                id="csv-upload"
                type="file"
                accept=".csv,text/csv" // Más explícito
                onChange={handleFileChange}
                className="max-w-md file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              />
            </div>
          </div>
          {selectedFile && !uploadResult && ( // Mostrar detalles del archivo solo si no hay resultado aún
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

          {/* NUEVO: Mostrar resultados de la carga del CSV */}
          {uploadResult && (
            <Alert variant={uploadResult.errorCount > 0 && uploadResult.successCount === 0 ? "destructive" : (uploadResult.errorCount > 0 ? "warning" : "success")}>
              <div className="flex items-start gap-2">
                {uploadResult.errorCount > 0 && uploadResult.successCount === 0 ? <AlertTriangle className="h-5 w-5" /> : <Info className="h-5 w-5"/>}
                <div>
                  <AlertTitle>
                    {uploadResult.successCount > 0 && uploadResult.errorCount === 0 ? "Carga Exitosa" : 
                     uploadResult.successCount > 0 && uploadResult.errorCount > 0 ? "Carga Parcialmente Exitosa" :
                     uploadResult.errorCount > 0 ? "Carga Fallida" : "Resultado de la Carga"}
                  </AlertTitle>
                  <AlertDescription>
                    <p>{uploadResult.message}</p>
                    <p>Registros procesados correctamente: {uploadResult.successCount}</p>
                    <p>Registros con errores: {uploadResult.errorCount}</p>
                    {uploadResult.errors && uploadResult.errors.length > 0 && (
                      <div className="mt-2 max-h-40 overflow-y-auto text-xs">
                        <p className="font-semibold">Detalles de errores:</p>
                        <ul className="list-disc pl-5">
                          {uploadResult.errors.map((err, index) => (
                            <li key={index}>
                              Fila {err.row}: {err.identificacion ? `(ID: ${err.identificacion}) ` : ''}{err.error}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={handleUpload} disabled={!selectedFile || isUploading}>
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cargando y Procesando... {/* Texto más descriptivo */}
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

      {/* ... (AlertDialog para eliminar empleado igual que antes) ... */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro de eliminar este empleado?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el empleado "{employeeToDelete?.nombreApellido}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setEmployeeToDelete(null)} disabled={isBatchDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
                onClick={confirmDelete} 
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={isBatchDeleting}
            >
              {isBatchDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}