import Image from 'next/image';
import LoginForm from '@/components/auth/login-form';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">
      {/* Left Panel */}
      <div
        className="relative hidden w-1/2 flex-col items-center justify-center bg-card text-white lg:flex"
        style={{ backgroundColor: 'hsl(var(--calypso-red))' }}
      >
        <div className="absolute inset-0 bg-black opacity-25" /> {/* Optional overlay */}
        <div className="z-10 text-center p-8">
          {/* Placeholder for the new main image/logo if desired */}
          {/* <Image
            src="https://placehold.co/200x200.png"
            alt="Visitor Management System Icon"
            width={150}
            height={150}
            className="mx-auto mb-6 rounded-full"
            data-ai-hint="system icon"
          /> */}
          <h1 className="text-4xl font-bold">
            GESTIÓN DE <span className="font-semibold">VISITANTES</span>
          </h1>
          <p className="mt-3 text-lg text-gray-200">
            Eficiencia y seguridad en el acceso.
          </p>
        </div>
      </div>

      {/* Right Panel (Login Form) */}
      <div className="flex w-full flex-col items-center justify-center bg-background p-8 lg:w-1/2">
        <div className="mb-10 self-start">
          <Image
            src="https://placehold.co/120x120.png"
            alt="Logo de la Empresa"
            width={120}
            height={120}
            data-ai-hint="pelican logo"
          />
        </div>
        <div className="w-full max-w-sm">
          <h2 className="mb-2 text-3xl font-semibold text-foreground">
            Iniciar sesión
          </h2>
          <p className="mb-8 text-muted-foreground">
            Bienvenido de nuevo. Por favor, ingrese sus credenciales.
          </p>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
