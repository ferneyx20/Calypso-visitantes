
"use client";

import { useState, useCallback, useEffect } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Debounce function
const debounce = <F extends (...args: any[]) => any>(func: F, waitFor: number) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: Parameters<F>) => {
    if (timeout !== null) {
      clearTimeout(timeout);
      timeout = null;
    }
    timeout = setTimeout(() => func(...args), waitFor);
  };

  return debounced as (...args: Parameters<F>) => ReturnType<F>;
};


const visitorSchema = z.object({
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  purpose: z.string().min(5, { message: "El propósito debe tener al menos 5 caracteres." }),
  contactNumber: z.string().regex(/^\+?[0-9\s-()]{7,20}$/, { message: "Número de contacto inválido." }),
  category: z.string().optional(),
});

type VisitorFormData = z.infer<typeof visitorSchema>;

export default function VisitorRegistrationForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCategorizing, setIsCategorizing] = useState(false);
  const [suggestedCategory, setSuggestedCategory] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<VisitorFormData>({
    resolver: zodResolver(visitorSchema),
  });

  const purposeValue = watch("purpose");

  const fetchCategorySuggestion = useCallback(async (purposeText: string) => {
    if (purposeText.trim().length < 10) { // Only fetch if purpose has some length
      setSuggestedCategory(null);
      return;
    }
    setIsCategorizing(true);
    try {
      const response = await fetch("/api/categorize-visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purpose: purposeText }),
      });
      if (!response.ok) {
        throw new Error("Error al obtener la categoría");
      }
      const data = await response.json();
      setSuggestedCategory(data.suggestedCategory);
    } catch (error) {
      console.error("Error fetching category:", error);
      setSuggestedCategory(null); // Clear suggestion on error
      // Optionally, show a toast for categorization error
      // toast({ title: "Error", description: "No se pudo sugerir una categoría.", variant: "destructive" });
    } finally {
      setIsCategorizing(false);
    }
  }, []);

  const debouncedFetchCategory = useCallback(debounce(fetchCategorySuggestion, 750), [fetchCategorySuggestion]);

  useEffect(() => {
    if (purposeValue) {
      debouncedFetchCategory(purposeValue);
    } else {
      setSuggestedCategory(null);
    }
  }, [purposeValue, debouncedFetchCategory]);


  const onSubmit: SubmitHandler<VisitorFormData> = async (data) => {
    setIsSubmitting(true);
    // Here you would typically send data to your backend
    console.log("Visitor Data:", data);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    toast({
      title: "Registro Exitoso",
      description: `${data.name} ha sido registrado.`,
    });
    setIsSubmitting(false);
    // Reset form or redirect as needed
    // reset(); // Example: reset form fields
    setSuggestedCategory(null); // Clear suggestion
  };

  const handleSuggestionClick = () => {
    if (suggestedCategory) {
      setValue("category", suggestedCategory, { shouldValidate: true });
      toast({
        title: "Categoría Aplicada",
        description: `Se aplicó la categoría "${suggestedCategory}".`
      });
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl text-foreground">Registrar Nuevo Visitante</CardTitle>
        <CardDescription>Ingrese la información del visitante a continuación.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre Completo</Label>
            <Input id="name" {...register("name")} placeholder="Ej: Ana Pérez" />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="purpose">Propósito de la Visita</Label>
            <Textarea
              id="purpose"
              {...register("purpose")}
              placeholder="Ej: Reunión con el departamento de marketing, Entrevista de trabajo, Entrega de paquete"
              rows={3}
            />
            {errors.purpose && <p className="text-sm text-destructive">{errors.purpose.message}</p>}
             {isCategorizing && (
              <div className="flex items-center text-sm text-muted-foreground mt-1">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sugiriendo categoría...
              </div>
            )}
            {suggestedCategory && !isCategorizing && (
              <div className="mt-2 flex items-center gap-2">
                 <Lightbulb className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-muted-foreground">Sugerencia:</span>
                <Badge
                  variant="secondary"
                  onClick={handleSuggestionClick}
                  className="cursor-pointer hover:bg-accent hover:text-accent-foreground"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleSuggestionClick()}
                >
                  {suggestedCategory}
                </Badge>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactNumber">Número de Contacto</Label>
            <Input id="contactNumber" type="tel" {...register("contactNumber")} placeholder="Ej: +1 555 123 4567" />
            {errors.contactNumber && <p className="text-sm text-destructive">{errors.contactNumber.message}</p>}
          </div>
           {watch("category") && (
            <div className="space-y-1">
              <Label htmlFor="categoryDisplay">Categoría Seleccionada</Label>
              <Input id="categoryDisplay" value={watch("category")} readOnly className="bg-muted/50" />
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registrando...
              </>
            ) : (
              "Registrar Visitante"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
