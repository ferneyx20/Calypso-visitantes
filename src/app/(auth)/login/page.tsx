import Image from 'next/image';
import LoginForm from '@/components/auth/login-form';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">
      {/* Left Panel */}
      <div
        className="relative hidden w-1/2 flex-col items-center justify-center bg-card text-foreground lg:flex"
        style={{ backgroundColor: 'hsl(var(--calypso-red))' }}
      >
        <div className="absolute inset-0 bg-black opacity-25" /> {/* Optional overlay */}
        <div className="z-10 text-center p-8">
          <h1 className="text-4xl font-bold">
            GESTIÓN DE <span className="font-semibold">VISITANTES</span>
          </h1>
          <p className="mt-3 text-lg" style={{ color: 'hsl(var(--primary-foreground))' }}>
            Eficiencia y seguridad en el acceso.
          </p>
        </div>
      </div>

      {/* Right Panel (Login Form) */}
      <div className="flex w-full flex-col items-center justify-center bg-background p-8 lg:w-1/2">
        <div className="mb-10 self-start">
          {/* 
            Asegúrate de colocar tu imagen 'pelican_logo.png' 
            en la carpeta 'public/images/' de tu proyecto.
          */}
          <Image
            src="/images/pelican_logo.png" // Ruta a la imagen en la carpeta public
            alt="Logo de la Empresa"
            width={120}
            height={120}
            priority // Cargar la imagen con prioridad ya que es importante para el LCP
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
