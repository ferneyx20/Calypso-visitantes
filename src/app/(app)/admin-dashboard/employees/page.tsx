
"use client";

import { useState, type ChangeEvent } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UsersRound, Upload, FileText, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function EmployeesPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

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
        event.target.value = ""; // Clear the input
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
    // Simulate API call for upload
    // In a real application, you would send the file to a server endpoint here
    await new Promise(resolve => setTimeout(resolve, 2000));

    setIsUploading(false);
    toast({
      title: "Carga Exitosa (Simulada)",
      description: `El archivo ${selectedFile.name} ha sido procesado.`,
    });
    setSelectedFile(null);
    // Clear the file input if possible (might need a ref or reset the form)
    const fileInput = document.getElementById('csv-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  return (
    <div className="container mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold flex items-center">
          <UsersRound className="mr-3 h-8 w-8 text-primary" />
          Gestión de Empleados
        </h1>
      </div>

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

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Lista de Empleados</CardTitle>
          <CardDescription>
            Aquí se mostrará la tabla con los empleados registrados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mt-4 flex items-center justify-center h-40 border-2 border-dashed border-border rounded-lg bg-card">
            <p className="text-muted-foreground">Próximamente: Tabla de Empleados</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
