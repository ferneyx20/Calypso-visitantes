
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
import { UsersRound, Upload, FileText, Loader2, Plus, UserPlus, Search, Pencil, Trash2, CheckCircle } from "lucide-react";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { notify } from "@/components/layout/app-header"; // Importar el emisor de notificaciones


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


export default function EmployeesPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
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
      description: `El archivo ${selectedFile.name} ha sido procesado. Los empleados (si son válidos) deberían aparecer en la lista.`,
    });
    setSelectedFile(null);
    const fileInput = document.getElementById('csv-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

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
        type: 'user_updated', // Podría ser un tipo 'employee_deleted'
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

      <Card className="shadow-lg w-full">
        <CardHeader>
          <CardTitle>Cargar Empleados desde CSV</CardTitle>
          <CardDescription>
            Seleccione un archivo CSV para importar la lista de empleados.
            El archivo debe tener las siguientes columnas en este orden:
            <code className="block bg-muted p-2 rounded-md my-2 text-sm">
              identificacion,nombre y apellido,cargo,sede_id
            </code>
             Asegúrese de que la primera fila contenga estas cabeceras y que `sede_id` corresponda a un ID de sede existente.
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
                Cargar y Procesar CSV (Simulado)
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

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
