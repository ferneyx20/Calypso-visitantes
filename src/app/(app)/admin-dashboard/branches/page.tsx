
"use client";

import { useState, useEffect } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Building2, Plus, Loader2, Pencil, Trash2 } from "lucide-react";
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

const branchSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, { message: "El nombre de la sede debe tener al menos 3 caracteres." }),
  address: z.string().min(5, { message: "La dirección debe tener al menos 5 caracteres." }),
});

type BranchFormData = z.infer<typeof branchSchema>;

export default function BranchesPage() {
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [branchesList, setBranchesList] = useState<BranchFormData[]>([]);
  const [editingBranch, setEditingBranch] = useState<BranchFormData | null>(null);
  const [branchToDelete, setBranchToDelete] = useState<BranchFormData | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);

  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<BranchFormData>({
    resolver: zodResolver(branchSchema),
  });

  const handleOpenFormDialog = (branch?: BranchFormData) => {
    if (branch) {
      setEditingBranch(branch);
      setValue("name", branch.name);
      setValue("address", branch.address);
      setValue("id", branch.id);
    } else {
      setEditingBranch(null);
      reset({ name: "", address: "", id: undefined });
    }
    setIsFormDialogOpen(true);
  };

  const onSubmit: SubmitHandler<BranchFormData> = async (data) => {
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

    if (editingBranch) {
      // Update existing branch
      setBranchesList(prev => prev.map(b => b.id === editingBranch.id ? { ...b, ...data } : b));
      toast({
        title: "Sede Actualizada",
        description: `La sede "${data.name}" ha sido actualizada.`,
      });
    } else {
      // Add new branch
      const newBranch = { ...data, id: `branch-${Date.now()}` };
      setBranchesList(prev => [...prev, newBranch]);
      toast({
        title: "Sede Agregada",
        description: `La sede "${data.name}" ha sido agregada.`,
      });
    }

    setIsSubmitting(false);
    setIsFormDialogOpen(false);
    setEditingBranch(null);
    reset({ name: "", address: "", id: undefined });
  };

  const handleDeleteClick = (branch: BranchFormData) => {
    setBranchToDelete(branch);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (branchToDelete) {
      setBranchesList(prev => prev.filter(b => b.id !== branchToDelete.id));
      toast({
        title: "Sede Eliminada",
        description: `La sede "${branchToDelete.name}" ha sido eliminada.`,
        variant: "destructive"
      });
      setBranchToDelete(null);
    }
    setIsDeleteDialogOpen(false);
  };

  const handleSelectAll = (checked: boolean | "indeterminate") => {
    if (checked === true) {
      setSelectedBranchIds(branchesList.map(b => b.id!));
    } else {
      setSelectedBranchIds([]);
    }
  };

  const handleRowSelect = (branchId: string, checked: boolean | "indeterminate") => {
    if (checked === true) {
      setSelectedBranchIds(prev => [...prev, branchId]);
    } else {
      setSelectedBranchIds(prev => prev.filter(id => id !== branchId));
    }
  };
  
  const isAllSelected = branchesList.length > 0 && selectedBranchIds.length === branchesList.length;
  const isSomeSelected = selectedBranchIds.length > 0 && selectedBranchIds.length < branchesList.length;


  return (
    <div className="w-full flex flex-col flex-1 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold flex items-center">
          <Building2 className="mr-3 h-8 w-8 text-primary" />
          Gestión de Sedes
        </h1>
        <Dialog open={isFormDialogOpen} onOpenChange={(isOpen) => {
            setIsFormDialogOpen(isOpen);
            if (!isOpen) {
              setEditingBranch(null);
              reset({ name: "", address: "", id: undefined });
            }
          }}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" onClick={() => handleOpenFormDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Sede
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Agregar Nueva Sede</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingBranch ? "Editar Sede" : "Agregar Nueva Sede"}</DialogTitle>
              <DialogDescription>
                {editingBranch ? "Modifique los detalles de la sede." : "Complete los detalles de la nueva sede."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre de la Sede</Label>
                <Input
                  id="name"
                  placeholder="Ej: Sede Principal, Sucursal Centro"
                  {...register("name")}
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Dirección de la Sede</Label>
                <Input
                  id="address"
                  placeholder="Ej: Calle Falsa 123, Ciudad"
                  {...register("address")}
                />
                {errors.address && <p className="text-sm text-destructive">{errors.address.message}</p>}
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline" disabled={isSubmitting}>
                    Cancelar
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {editingBranch ? "Actualizando..." : "Guardando..."}
                    </>
                  ) : (
                    editingBranch ? "Actualizar Sede" : "Guardar Sede"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {selectedBranchIds.length > 0 && (
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md border">
            <span className="text-sm text-muted-foreground">{selectedBranchIds.length} sede(s) seleccionada(s)</span>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                        <Trash2 className="mr-2 h-4 w-4"/>
                        Eliminar Seleccionadas
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta acción eliminará permanentemente {selectedBranchIds.length} sede(s) seleccionada(s). Esta acción no se puede deshacer.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={() => {
                            setBranchesList(prev => prev.filter(b => !selectedBranchIds.includes(b.id!)));
                            setSelectedBranchIds([]);
                            toast({ title: "Sedes Eliminadas", description: `${selectedBranchIds.length} sede(s) han sido eliminadas.`, variant: "destructive"});
                        }}
                        className={selectedBranchIds.length > 0 ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
                        disabled={selectedBranchIds.length === 0}
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
          <CardTitle>Listado de Sedes</CardTitle>
          <CardDescription>
            Aquí podrá ver las sedes creadas. Puede editar o eliminar cada sede.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-0 flex flex-col flex-1">
          {branchesList.length > 0 ? (
            <div className="mt-4 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={isAllSelected || (isSomeSelected && 'indeterminate')}
                        onCheckedChange={handleSelectAll}
                        aria-label="Seleccionar todas las filas"
                      />
                    </TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Dirección</TableHead>
                    <TableHead className="text-right w-[120px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {branchesList.map((branch) => (
                    <TableRow key={branch.id} data-state={selectedBranchIds.includes(branch.id!) ? "selected" : ""}>
                      <TableCell>
                        <Checkbox
                          checked={selectedBranchIds.includes(branch.id!)}
                          onCheckedChange={(checked) => handleRowSelect(branch.id!, checked)}
                          aria-label={`Seleccionar fila ${branch.name}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{branch.name}</TableCell>
                      <TableCell>{branch.address}</TableCell>
                      <TableCell className="text-right">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={() => handleOpenFormDialog(branch)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Editar Sede</p></TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(branch)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Eliminar Sede</p></TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="mt-4 flex flex-1 items-center justify-center border-2 border-dashed border-border rounded-lg bg-card">
              <p className="text-muted-foreground">No hay sedes creadas aún.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro de eliminar esta sede?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la sede "{branchToDelete?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBranchToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

    