'use client';

import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Lock } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { loginAction, type LoginActionResult } from '@/app/(auth)/login/actions';


const loginSchema = z.object({
  email: z.string().email({ message: 'Por favor, ingrese un correo válido.' }),
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres.' }),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
      // Create FormData to pass to server action
      const formData = new FormData();
      formData.append('email', data.email);
      formData.append('password', data.password);

      const result: LoginActionResult = await loginAction(null, formData);

      if (result.success) {
        toast({
          title: 'Inicio de Sesión Exitoso',
          description: 'Redirigiendo al panel de control...',
        });
        router.push('/'); // Redirect to dashboard
        router.refresh(); // Refresh to apply cookie changes for middleware
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="email">Usuario (Correo Electrónico)</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            {...register('email')}
            placeholder="usuario@ejemplo.com"
            className="pl-10"
          />
        </div>
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            type="password"
            {...register('password')}
            placeholder="••••••••"
            className="pl-10"
          />
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
      <div className="text-center">
        <Link href="#" className="text-sm text-primary hover:underline">
          ¿Olvidó su contraseña?
        </Link>
      </div>
    </form>
  );
}
