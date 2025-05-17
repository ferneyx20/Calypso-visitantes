
'use client';

import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Lock, Eye, EyeOff } from 'lucide-react';
// Link component is no longer needed
// import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { loginAction, type LoginActionResult } from '@/app/(auth)/login/actions';


const loginSchema = z.object({
  identification: z.string().min(1, { message: 'Por favor, ingrese su identificación.' }), 
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres.' }),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit: SubmitHandler<LoginFormInputs> = (data) => {
    setErrorMessage(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.append('identification', data.identification);
      formData.append('password', data.password);

      const result: LoginActionResult = await loginAction(null, formData);

      if (result.success) {
        toast({
          title: 'Inicio de Sesión Exitoso',
          description: 'Redirigiendo al panel de control...',
        });
        router.push('/admin-dashboard'); // Updated redirect path
        router.refresh();
      } else {
        setErrorMessage(result.message);
        toast({
          title: 'Error de Inicio de Sesión',
          description: result.message,
          variant: 'destructive',
        });
      }
    });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="identification">Identificación</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="identification"
            type="text"
            {...register('identification')}
            placeholder="Ingrese su identificación"
            className="pl-10"
          />
        </div>
        {errors.identification && <p className="text-sm text-destructive">{errors.identification.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            {...register('password')}
            placeholder="••••••••"
            className="pl-10 pr-10" // Added pr-10 for the icon
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
        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
      </div>

      {errorMessage && (
        <p className="text-sm text-destructive">{errorMessage}</p>
      )}

      <Button type="submit" className="w-full" variant="destructive" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Iniciando...
          </>
        ) : (
          'INICIAR SESIÓN'
        )}
      </Button>
    </form>
  );
}
