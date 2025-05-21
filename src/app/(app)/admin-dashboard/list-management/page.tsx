"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ListChecks, Plus, Trash2, Edit, Save, X, Loader2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ManagedListItem as PrismaManagedListItem, ManagedListType } from "@prisma/client"; // Importar tipos de Prisma

// Definir los títulos de las listas y su tipo correspondiente del enum de Prisma
// Esto mapea el ManagedListType del backend a un título legible para el frontend.
const LIST_CONFIGS: Array<{ title: string; listType: ManagedListType; description: string }> = [
  { title: "Tipos de Documento", listType: "TIPOS_DE_DOCUMENTO" as ManagedListType, description: "Ej: Cédula, Pasaporte, NIT" },
  { title: "Géneros", listType: "GENEROS" as ManagedListType, description: "Ej: Masculino, Femenino, Otro" },
  { title: "Factores RH", listType: "FACTORES_RH" as ManagedListType, description: "Ej: O+, A-, AB+" },
  { title: "Tipos de Visita", listType: "TIPOS_DE_VISITA" as ManagedListType, description: "Ej: Programada, Proveedor" },
  { title: "ARLs", listType: "ARLS" as ManagedListType, description: "Ej: Sura, Positiva, Colmena" },
  { title: "EPSs", listType: "EPSS" as ManagedListType, description: "Ej: Sanitas, Compensar, Nueva EPS" },
  { title: "Parentescos Contacto Emergencia", listType: "PARENTESCOS_CONTACTO_EMERGENCIA" as ManagedListType, description: "Ej: Esposo(a), Padre, Amigo(a)" },
  // Agrega más listas aquí si las definiste en el enum ManagedListType
];

interface ManagedListClientState {
  title: string;
  listType: ManagedListType;
  description: string;
  options: PrismaManagedListItem[]; // Ahora usamos el tipo de Prisma
  isLoading: boolean;
  error?: string;
}

function EditableListItemClient({ 
  item, 
  onDelete, 
  onUpdate,
  isUpdating,
  isDeleting
}: { 
  item: PrismaManagedListItem, 
  onDelete: (id: string) => Promise<void>, 
  onUpdate: (id: string, newValue: string) => Promise<void>,
  isUpdating: boolean,
  isDeleting: string | null // ID del ítem que se está borrando
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(item.value);
  const { toast } = useToast();

  const handleSave = async () => {
    if (editValue.trim() === "") {
        toast({ title: "Error", description: "El valor no puede estar vacío.", variant: "destructive" });
        return;
    }
    if (editValue.trim() !== item.value) { // Solo actualizar si hay cambios
        await onUpdate(item.id, editValue.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(item.value);
    setIsEditing(false);
  };

  const currentlyDeleting = isDeleting === item.id;

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 p-2 border-b border-border">
        <Input 
          value={editValue} 
          onChange={(e) => setEditValue(e.target.value)} 
          className="flex-grow h-8"
          disabled={isUpdating}
        />
        <Button variant="ghost" size="icon" onClick={handleSave} disabled={isUpdating || editValue.trim() === item.value} className="text-green-600 hover:text-green-700 h-8 w-8">
          {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={handleCancel} disabled={isUpdating} className="text-gray-500 hover:text-gray-600 h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-2 border-b border-border hover:bg-muted/50">
      <span className="text-sm">{item.value}</span>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)} className="text-blue-600 hover:text-blue-700 h-8 w-8" disabled={currentlyDeleting}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onDelete(item.id)} className="text-destructive hover:text-destructive/90 h-8 w-8" disabled={currentlyDeleting}>
          {currentlyDeleting ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}


export default function ListManagementPage() {
  const { toast } = useToast();
  const [managedListsData, setManagedListsData] = useState<Record<ManagedListType, ManagedListClientState>>(
    LIST_CONFIGS.reduce((acc, config) => {
      acc[config.listType] = { 
        ...config, 
        options: [], 
        isLoading: true, // Inicialmente cargando
      };
      return acc;
    }, {} as Record<ManagedListType, ManagedListClientState>)
  );
  const [newItemValues, setNewItemValues] = useState<Record<ManagedListType, string>>(
    LIST_CONFIGS.reduce((acc, config) => ({ ...acc, [config.listType]: "" }), {} as Record<ManagedListType, string>)
  );
  const [isSubmittingNewItem, setIsSubmittingNewItem] = useState<ManagedListType | null>(null);
  const [isUpdatingItem, setIsUpdatingItem] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);


  const fetchListItems = useCallback(async (listType: ManagedListType) => {
    setManagedListsData(prev => ({
      ...prev,
      [listType]: { ...prev[listType], isLoading: true, error: undefined }
    }));
    try {
      const response = await fetch(`/api/listas-gestionables?listType=${listType}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error al cargar la lista: ${listType}`);
      }
      const items: PrismaManagedListItem[] = await response.json();
      setManagedListsData(prev => ({
        ...prev,
        [listType]: { ...prev[listType], options: items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)), isLoading: false }
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      toast({ title: `Error cargando ${listType}`, description: errorMessage, variant: "destructive" });
      setManagedListsData(prev => ({
        ...prev,
        [listType]: { ...prev[listType], isLoading: false, error: errorMessage }
      }));
    }
  }, [toast]);

  useEffect(() => {
    LIST_CONFIGS.forEach(config => fetchListItems(config.listType));
  }, [fetchListItems]);

  const handleAddNewItem = async (listType: ManagedListType) => {
    const value = newItemValues[listType]?.trim();
    if (!value) {
      toast({ title: "Error", description: "El valor no puede estar vacío.", variant: "destructive" });
      return;
    }

    const currentList = managedListsData[listType];
    if (currentList.options.some(opt => opt.value.toLowerCase() === value.toLowerCase())) {
      toast({ title: "Error", description: "Esta opción ya existe en la lista.", variant: "destructive" });
      return;
    }

    setIsSubmittingNewItem(listType);
    try {
      const response = await fetch(`/api/listas-gestionables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listType, value }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al agregar la opción.");
      }
      // const newItem: PrismaManagedListItem = await response.json(); // Asumiendo que la API devuelve el item creado
      // setManagedListsData(prev => ({
      //   ...prev,
      //   [listType]: { ...prev[listType], options: [...prev[listType].options, newItem].sort((a,b) => (a.order ?? 0) - (b.order ?? 0)) }
      // }));
      await fetchListItems(listType); // Re-fetch para obtener el orden correcto y el ID del servidor
      setNewItemValues(prev => ({ ...prev, [listType]: "" }));
      toast({ title: "Éxito", description: `Opción "${value}" agregada a ${currentList.title}.` });
    } catch (error) {
      toast({ title: "Error al agregar", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsSubmittingNewItem(null);
    }
  };

  const handleDeleteItem = async (listType: ManagedListType, itemId: string) => {
    setDeletingItemId(itemId);
    try {
      const response = await fetch(`/api/listas-gestionables/${itemId}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al eliminar la opción.");
      }
      // setManagedListsData(prev => ({
      //   ...prev,
      //   [listType]: { ...prev[listType], options: prev[listType].options.filter(opt => opt.id !== itemId) }
      // }));
      await fetchListItems(listType); // Re-fetch
      toast({ title: "Éxito", description: `Opción eliminada de ${managedListsData[listType].title}.` });
    } catch (error) {
      toast({ title: "Error al eliminar", description: (error as Error).message, variant: "destructive" });
    } finally {
      setDeletingItemId(null);
    }
  };

  const handleUpdateItem = async (listType: ManagedListType, itemId: string, newValue: string) => {
    const currentList = managedListsData[listType];
    if (currentList.options.some(opt => opt.id !== itemId && opt.value.toLowerCase() === newValue.toLowerCase())) {
        toast({ title: "Error", description: "Esta opción ya existe en la lista.", variant: "destructive" });
        return;
    }
    setIsUpdatingItem(true);
    try {
      const response = await fetch(`/api/listas-gestionables/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: newValue }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al actualizar la opción.");
      }
      // const updatedItem: PrismaManagedListItem = await response.json();
      // setManagedListsData(prev => ({
      //   ...prev,
      //   [listType]: { 
      //       ...prev[listType], 
      //       options: prev[listType].options.map(opt => opt.id === itemId ? updatedItem : opt).sort((a,b) => (a.order ?? 0) - (b.order ?? 0))
      //   }
      // }));
      await fetchListItems(listType); // Re-fetch
      toast({ title: "Éxito", description: `Opción actualizada en ${currentList.title}.` });
    } catch (error) {
      toast({ title: "Error al actualizar", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsUpdatingItem(false);
    }
  };


  return (
    <div className="w-full flex flex-col flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold flex items-center">
          <ListChecks className="mr-3 h-8 w-8 text-primary" />
          Gestión de Listas Desplegables
        </h1>
      </div>
      <p className="text-muted-foreground">
        Administre las opciones disponibles en los diferentes formularios de la aplicación.
        Los cambios realizados aquí se guardarán en la base de datos.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {LIST_CONFIGS.map((listConfig) => {
          const listState = managedListsData[listConfig.listType];
          if (!listState) return null; // No debería pasar si está inicializado correctamente

          return (
            <Card key={listState.title} className="shadow-lg flex flex-col w-full">
              <CardHeader>
                <CardTitle>{listState.title}</CardTitle>
                <CardDescription>{listState.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-3">
                {listState.isLoading ? (
                  <div className="flex justify-center items-center h-20">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : listState.error ? (
                    <div className="flex flex-col items-center justify-center h-20 text-destructive">
                        <AlertTriangle className="h-6 w-6 mb-1"/>
                        <p className="text-sm text-center">Error al cargar: <br/> {listState.error}</p>
                    </div>
                ) : (
                  <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
                    {listState.options.length > 0 ? (
                      listState.options.map((item) => (
                        <EditableListItemClient
                          key={item.id}
                          item={item}
                          onDelete={(itemId) => handleDeleteItem(listState.listType, itemId)}
                          onUpdate={(itemId, newValue) => handleUpdateItem(listState.listType, itemId, newValue)}
                          isUpdating={isUpdatingItem}
                          isDeleting={deletingItemId}
                        />
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">No hay opciones en esta lista.</p>
                    )}
                  </div>
                )}
              </CardContent>
              <CardFooter className="border-t pt-4">
                <div className="flex items-center gap-2 w-full">
                  <Input
                    placeholder="Nueva opción..."
                    value={newItemValues[listState.listType]}
                    onChange={(e) => setNewItemValues(prev => ({ ...prev, [listState.listType]: e.target.value }))}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddNewItem(listState.listType)}
                    className="flex-grow"
                    disabled={listState.isLoading || !!listState.error || isSubmittingNewItem === listState.listType}
                  />
                  <Button 
                    onClick={() => handleAddNewItem(listState.listType)} 
                    size="icon"
                    disabled={listState.isLoading || !!listState.error || isSubmittingNewItem === listState.listType || !newItemValues[listState.listType]?.trim()}
                  >
                    {isSubmittingNewItem === listState.listType ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}