'use client';

import { useEffect, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom'; // Importados para Server Actions con estado
import { useRouter } from 'next/navigation';
import { z } from 'zod'; // Zod ya no es necesario aquí si la validación principal está en actions.ts
// Podrías mantenerlo para validación del lado del cliente antes de enviar, pero es opcional.

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Lock, Eye, EyeOff } from 'lucide-react';
import { loginAction, type LoginActionResult } from '@/app/(auth)/login/actions'; // Asegúrate que la ruta sea correcta

// El schema de Zod para el formulario ahora es manejado principalmente por la Server Action,
// pero puedes mantenerlo aquí para validación del lado del cliente si lo deseas.
// Por simplicidad, lo comentaremos aquí para depender de la validación del servidor.
/*
const loginSchema = z.object({
  identification: z.string().min(1, { message: 'Por favor, ingrese su identificación.' }),
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres.' }),
});
type LoginFormInputs = z.infer<typeof loginSchema>;
*/

const initialState: LoginActionResult = {
  success: false,
  message: '', // Mensaje general
  error: undefined, // Para errores específicos de Zod u otros
  redirectTo: undefined,
  userRole: undefined,
};

// Componente para el botón de submit, para usar useFormStatus
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" variant="destructive" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Iniciando...
        </>
      ) : (
        'INICIAR SESIÓN'
      )}
    </Button>
  );
}

export default function LoginForm() {
  const { toast } = useToast();
  const router = useRouter();
  // Usamos useFormState para manejar el estado de la Server Action
  const [state, formAction] = useFormState(loginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);

  // useEffect para manejar los resultados de la Server Action (éxito o error)
  useEffect(() => {
    if (state.success && state.redirectTo) {
      toast({
        title: 'Inicio de Sesión Exitoso',
        description: state.message || 'Redirigiendo...', // Usar mensaje del estado
      });
      router.push(state.redirectTo);
      // router.refresh(); // No siempre es necesario, depende si necesitas refrescar datos en la nueva ruta inmediatamente
    } else if (!state.success && state.message) {
      // Mostrar error general o específico de validación
      const description = state.error || state.message;
      toast({
        title: 'Error de Inicio de Sesión',
        description: description,
        variant: 'destructive',
      });
    }
  }, [state, router, toast]); // Añadir toast a las dependencias

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Ya no necesitamos useForm de react-hook-form para el manejo del submit si usamos useFormState
  // para una Server Action simple. Los errores de Zod se manejarán a través de `state.error`.
  // Si quieres validación en el cliente ANTES de enviar, puedes reintroducir react-hook-form.
  return (
    <form action={formAction} className="space-y-6"> {/* action ahora es formAction */}
      <div className="space-y-2">
        <Label htmlFor="identification">Identificación</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="identification"
            name="identification" // name es importante para FormData
            type="text"
            placeholder="Ingrese su identificación"
            className="pl-10"
            required // Atributo HTML para validación básica
          />
        </div>
        {/* Los errores de campo específicos de Zod (si los implementas en `state.error`) se podrían mostrar aquí */}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            name="password" // name es importante para FormData
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            className="pl-10 pr-10"
            required // Atributo HTML para validación básica
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={togglePasswordVisibility}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
        {/* Los errores de campo específicos de Zod se podrían mostrar aquí */}
      </div>

      {/* Mensaje general de error/éxito del estado de la Server Action */}
      {state.message && !state.success && ( // Mostrar solo si hay mensaje y no fue exitoso (el toast ya maneja el éxito)
        <p className={`text-sm ${state.success ? 'text-green-600' : 'text-destructive'}`}>
          {state.error || state.message}
        </p>
      )}
      
      <SubmitButton /> {/* Usar el componente SubmitButton */}
    </form>
  );
}