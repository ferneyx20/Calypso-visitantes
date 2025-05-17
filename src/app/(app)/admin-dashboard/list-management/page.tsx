
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ListChecks, Plus, Trash2, Edit, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  TIPO_DOCUMENTO,
  GENERO,
  RH,
  TIPO_VISITA_OPTIONS,
  ARL_OPTIONS,
  EPS_OPTIONS,
  toWritableArray,
} from "../visitors/schemas"; // Assuming schemas are in visitors module

interface ListItem {
  id: string;
  value: string;
}

interface ManagedList {
  title: string;
  options: ListItem[];
  setOptions: React.Dispatch<React.SetStateAction<ListItem[]>>;
  addItem: (value: string) => void;
  deleteItem: (id: string) => void;
  updateItem: (id: string, newValue: string) => void;
}

function createManagedListState(initialOptions: readonly string[], title: string): ManagedList {
  const [options, setOptions] = useState<ListItem[]>(
    initialOptions.map((opt, index) => ({ id: `${title.toLowerCase().replace(/\s+/g, '-')}-${index}`, value: opt }))
  );
  const { toast } = useToast();

  const addItem = (value: string) => {
    if (value.trim() === "") {
      toast({ title: "Error", description: "El valor no puede estar vacío.", variant: "destructive" });
      return;
    }
    if (options.some(opt => opt.value.toLowerCase() === value.toLowerCase().trim())) {
      toast({ title: "Error", description: "Esta opción ya existe en la lista.", variant: "destructive" });
      return;
    }
    setOptions(prev => [...prev, { id: `${title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`, value: value.trim() }]);
    toast({ title: "Éxito", description: `Opción "${value.trim()}" agregada a ${title}.` });
  };

  const deleteItem = (id: string) => {
    setOptions(prev => prev.filter(opt => opt.id !== id));
    toast({ title: "Éxito", description: `Opción eliminada de ${title}.` });
  };

  const updateItem = (id: string, newValue: string) => {
    if (newValue.trim() === "") {
      toast({ title: "Error", description: "El valor no puede estar vacío.", variant: "destructive" });
      return;
    }
    // Check if another item (not the one being edited) already has the new value
    if (options.some(opt => opt.id !== id && opt.value.toLowerCase() === newValue.toLowerCase().trim())) {
        toast({ title: "Error", description: "Esta opción ya existe en la lista.", variant: "destructive" });
        return;
    }
    setOptions(prev => prev.map(opt => opt.id === id ? { ...opt, value: newValue.trim() } : opt));
    toast({ title: "Éxito", description: `Opción actualizada en ${title}.` });
  };
  
  return { title, options, setOptions, addItem, deleteItem, updateItem };
}


function EditableListItem({ item, onDelete, onUpdate }: { item: ListItem, onDelete: (id: string) => void, onUpdate: (id: string, newValue: string) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(item.value);

  const handleSave = () => {
    onUpdate(item.id, editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(item.value);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 p-2 border-b border-border">
        <Input 
          value={editValue} 
          onChange={(e) => setEditValue(e.target.value)} 
          className="flex-grow h-8"
        />
        <Button variant="ghost" size="icon" onClick={handleSave} className="text-green-600 hover:text-green-700 h-8 w-8">
          <Save className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleCancel} className="text-gray-500 hover:text-gray-600 h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-2 border-b border-border hover:bg-muted/50">
      <span className="text-sm">{item.value}</span>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)} className="text-blue-600 hover:text-blue-700 h-8 w-8">
          <Edit className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onDelete(item.id)} className="text-destructive hover:text-destructive/90 h-8 w-8">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}


export default function ListManagementPage() {
  const { toast } = useToast(); // Toast hook for notifications

  // Initialize managed lists
  const tipoDocumentoList = createManagedListState(toWritableArray(TIPO_DOCUMENTO), "Tipos de Documento");
  const generoList = createManagedListState(toWritableArray(GENERO), "Géneros");
  const rhList = createManagedListState(toWritableArray(RH), "Grupos RH");
  const tipoVisitaList = createManagedListState(toWritableArray(TIPO_VISITA_OPTIONS), "Tipos de Visita");
  const arlList = createManagedListState(toWritableArray(ARL_OPTIONS), "ARLs");
  const epsList = createManagedListState(toWritableArray(EPS_OPTIONS), "EPSs");

  const allManagedLists: ManagedList[] = [
    tipoDocumentoList,
    generoList,
    rhList,
    tipoVisitaList,
    arlList,
    epsList,
  ];

  const [newItemValues, setNewItemValues] = useState<Record<string, string>>(
    allManagedLists.reduce((acc, list) => ({ ...acc, [list.title]: "" }), {})
  );

  const handleAddNewItem = (list: ManagedList) => {
    const value = newItemValues[list.title];
    list.addItem(value);
    setNewItemValues(prev => ({ ...prev, [list.title]: "" })); // Clear input after adding
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
        Los cambios aquí afectarán las opciones predefinidas la próxima vez que se carguen los formularios.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allManagedLists.map((list) => (
          <Card key={list.title} className="shadow-lg flex flex-col w-full">
            <CardHeader>
              <CardTitle>{list.title}</CardTitle>
              <CardDescription>Opciones para el campo "{list.title}".</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-3">
              <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
                {list.options.length > 0 ? (
                  list.options.map((item) => (
                    <EditableListItem 
                      key={item.id} 
                      item={item} 
                      onDelete={list.deleteItem}
                      onUpdate={list.updateItem}
                    />
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No hay opciones en esta lista.</p>
                )}
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4">
              <div className="flex items-center gap-2 w-full">
                <Input
                  placeholder="Nueva opción..."
                  value={newItemValues[list.title]}
                  onChange={(e) => setNewItemValues(prev => ({ ...prev, [list.title]: e.target.value }))}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddNewItem(list)}
                  className="flex-grow"
                />
                <Button onClick={() => handleAddNewItem(list)} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
