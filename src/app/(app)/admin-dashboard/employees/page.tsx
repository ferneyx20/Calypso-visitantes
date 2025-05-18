
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
import { UsersRound, Upload, FileText, Loader2, Plus, UserPlus, Search, Pencil, Trash2 } from "lucide-react"; // Added Pencil, Trash2
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox"; // Added Checkbox
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
} from "@/components/ui/alert-dialog"; // Added AlertDialog
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

  const [editingEmployee, setEditingEmployee] = useState<EmployeeFormData | null>(null);
  const [employeeToDelete, setEmployeeToDelete] = useState<EmployeeFormData | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);


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

  const handleOpenFormDialog = (employee?: EmployeeFormData) => {
    if (employee) {
      setEditingEmployee(employee);
      manualForm.reset(employee); // Populate form with employee data
    } else {
      setEditingEmployee(null);
      manualForm.reset({ identificacion: "", nombreApellido: "", cargo: "", sede: "", id: undefined });
    }
    setIsAddEmployeeDialogOpen(true);
  };


  const onManualSubmit: SubmitHandler<EmployeeFormData> = async (data) => {
    setIsSubmittingManual(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (editingEmployee) {
      setEmployeesList(prev => prev.map(emp => emp.id === editingEmployee.id ? { ...emp, ...data } : emp));
      toast({
        title: "Empleado Actualizado",
        description: `El empleado "${data.nombreApellido}" ha sido actualizado.`,
      });
    } else {
      const newEmployee = { ...data, id: `emp-${Date.now()}` };
      setEmployeesList(prev => [...prev, newEmployee]);
      toast({
        title: "Empleado Agregado",
        description: `El empleado "${data.nombreApellido}" ha sido agregado exitosamente.`,
      });
    }

    setIsSubmittingManual(false);
    setIsAddEmployeeDialogOpen(false);
    setEditingEmployee(null);
    manualForm.reset({ identificacion: "", nombreApellido: "", cargo: "", sede: "", id: undefined });
  };

  const handleDeleteClick = (employee: EmployeeFormData) => {
    setEmployeeToDelete(employee);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (employeeToDelete) {
      setEmployeesList(prev => prev.filter(emp => emp.id !== employeeToDelete.id));
      toast({
        title: "Empleado Eliminado",
        description: `El empleado "${employeeToDelete.nombreApellido}" ha sido eliminado.`,
        variant: "destructive"
      });
      setEmployeeToDelete(null);
    }
    setIsDeleteDialogOpen(false);
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
        emp.sede.toLowerCase().includes(searchTerm)
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
                manualForm.reset({ identificacion: "", nombreApellido: "", cargo: "", sede: "", id: undefined });
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
                  name="sede"
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
                    <Button variant="destructive" size="sm">
                        <Trash2 className="mr-2 h-4 w-4"/>
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
                        onClick={() => {
                            setEmployeesList(prev => prev.filter(emp => !selectedEmployeeIds.includes(emp.id!)));
                            setSelectedEmployeeIds([]);
                            toast({ title: "Empleados Eliminados", description: `${selectedEmployeeIds.length} empleado(s) han sido eliminados.`, variant: "destructive"});
                        }}
                        className={selectedEmployeeIds.length > 0 ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
                        disabled={selectedEmployeeIds.length === 0}
                    >
                        Eliminar
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
           {employeesList.length === 0 && !searchTerm ? (
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
                      <TableCell>{employee.sede}</TableCell>
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
                  Mostrando 5 de {filteredEmployees.length} empleados. Refine su búsqueda para ver más o seleccione empleados.
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

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro de eliminar este empleado?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el empleado "{employeeToDelete?.nombreApellido}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setEmployeeToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
    
