
"use client";

import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Building2, Plus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const branchSchema = z.object({
  name: z.string().min(3, { message: "El nombre de la sede debe tener al menos 3 caracteres." }),
  address: z.string().min(5, { message: "La dirección debe tener al menos 5 caracteres." }),
});

type BranchFormData = z.infer<typeof branchSchema>;

export default function BranchesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BranchFormData>({
    resolver: zodResolver(branchSchema),
  });

  const onSubmit: SubmitHandler<BranchFormData> = async (data) => {
    setIsSubmitting(true);
    console.log("Nueva Sede:", data);
    // Simular llamada a API
    await new Promise(resolve => setTimeout(resolve, 1500));

    toast({
      title: "Sede Agregada",
      description: `La sede "${data.name}" ha sido agregada exitosamente.`,
    });
    setIsSubmitting(false);
    setIsDialogOpen(false);
    reset();
  };

  return (
    <div className="w-full space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold flex items-center">
          <Building2 className="mr-3 h-8 w-8 text-primary" />
          Gestión de Sedes
        </h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Sede
                  </Button>
                </DialogTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Agregar Nueva Sede</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Agregar Nueva Sede</DialogTitle>
              <DialogDescription>
                Complete los detalles de la nueva sede a continuación.
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
                      Guardando...
                    </>
                  ) : (
                    "Guardar Sede"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Administrar Sedes</CardTitle>
          <CardDescription>
            Aquí podrá crear, editar y eliminar las sedes de la organización.
            La tabla de sedes aparecerá aquí.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mt-4 flex items-center justify-center h-60 border-2 border-dashed border-border rounded-lg bg-card">
            <p className="text-muted-foreground">Próximamente: Tabla de Sedes</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
