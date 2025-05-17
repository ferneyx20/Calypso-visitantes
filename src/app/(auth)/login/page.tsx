import Image from 'next/image';
import LoginForm from '@/components/auth/login-form';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">
      {/* Left Panel */}
      <div
        className="relative hidden w-1/2 flex-col items-center justify-center text-white lg:flex"
        style={{ backgroundColor: 'hsl(var(--calypso-red))' }}
      >
        <div className="absolute inset-0 bg-black opacity-20" /> {/* Optional overlay */}
        <div className="z-10 mb-16">
          <Image
            src="https://placehold.co/300x100.png?text=CALYPSO"
            alt="Calypso Logo"
            width={300}
            height={100}
            data-ai-hint="brand logo"
            className="mb-4"
          />
          <p className="mt-2 text-center text-2xl font-semibold">
            ALIMENTOS PARA <span className="font-bold">TODOS</span>
          </p>
        </div>
        <div
          className="absolute bottom-0 left-0 w-full p-10"
          style={{ backgroundColor: 'hsl(var(--calypso-orange-red))' }}
        >
          <h2 className="text-4xl font-bold">Portal Autogestión</h2>
        </div>
      </div>

      {/* Right Panel (Login Form) */}
      <div className="flex w-full flex-col items-center justify-center bg-card p-8 lg:w-1/2">
        <div className="mb-10 self-start">
          <Image
            src="https://placehold.co/150x50.png?text=Siesa"
            alt="Siesa Logo"
            width={150}
            height={50}
            data-ai-hint="company logo"
          />
        </div>
        <div className="w-full max-w-sm">
          <h1 className="mb-2 text-2xl font-semibold text-destructive">
            Iniciar sesión
          </h1>
          <p className="mb-8 text-muted-foreground">
            Bienvenido de nuevo. Por favor, ingrese sus credenciales.
          </p>
          <LoginForm />
        </div>
         <p className="mt-auto text-xs text-muted-foreground text-center">
            App: V1.24.1130.1 Api: V1.24.1130.1 Google Azure<br />
            BD Unoee: V BD Web: v
          </p>
      </div>
    </div>
  );
}
