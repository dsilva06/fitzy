import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthProvider';

const schema = z.object({
  email: z
    .string()
    .email({ message: 'Email inválido' })
    .min(1, { message: 'Email es requerido' }),
  password: z
    .string()
    .min(8, { message: 'La contraseña debe tener al menos 8 caracteres' }),
});

export default function Login() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const auth = useAuth();
  const [serverError, setServerError] = useState('');
  const fromState = location.state?.from;
  const redirectPath = fromState?.pathname ?? '/';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      email: import.meta.env?.VITE_FITZY_DEMO_EMAIL ?? 'test@example.com',
      password: import.meta.env?.VITE_FITZY_DEMO_PASSWORD ?? 'password',
    },
  });

  const mutation = useMutation({
    mutationFn: async ({ email, password }) =>
      auth.login({ email, password, deviceName: 'consumer-web' }),
    onSuccess: (user) => {
      queryClient.setQueryData(['currentUser'], user);
      navigate(redirectPath, { replace: true });
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.message ??
        err?.message ??
        'Error al iniciar sesión';
      setServerError(msg);
    },
  });

  const onSubmit = (data) => {
    setServerError('');
    mutation.mutate({
      email: data.email.trim().toLowerCase(),
      password: data.password,
    });
  };

  const handleDemoLogin = () => {
    const demoEmail = import.meta.env?.VITE_FITZY_DEMO_EMAIL ?? 'test@example.com';
    const demoPassword = import.meta.env?.VITE_FITZY_DEMO_PASSWORD ?? 'password';
    mutation.mutate({ email: demoEmail, password: demoPassword });
  };

  return (
    <div className="min-h-screen bg-[#96b5c9] relative overflow-hidden flex items-center justify-center px-4 py-12">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-16 top-10 h-60 w-60 rounded-full bg-white/25 blur-[120px]" />
        <div className="absolute left-10 bottom-10 h-48 w-48 rounded-full bg-white/20 blur-[100px]" />
        <div className="absolute inset-x-10 top-1/2 h-64 bg-gradient-to-b from-white/10 via-transparent to-white/5 blur-[140px]" />
      </div>
      <div className="relative w-full max-w-sm text-white font-['Space_Grotesk','Inter',sans-serif]">
        <div className="absolute -inset-6 bg-white/15 rounded-[60px] blur-3xl opacity-60" aria-hidden />
        <div className="relative rounded-[46px] border border-white/25 bg-[#96b5c9]/95 px-7 pb-10 pt-16 shadow-[0_45px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <div className="absolute left-1/2 top-4 h-6 w-28 -translate-x-1/2 rounded-full bg-black/70" aria-hidden />
          <div className="absolute left-6 top-16 flex gap-3" aria-hidden>
            <span className="h-5 w-1 rounded-full bg-white/40" />
            <span className="h-5 w-1 rounded-full bg-white/40" />
          </div>

          <div className="text-center space-y-3">
            <p
              className="text-[54px] tracking-[0.45em] uppercase font-extralight drop-shadow-[0_4px_15px_rgba(0,0,0,0.25)]"
              style={{ fontFamily: '"Cinzel Decorative", "Playfair Display", "Cormorant Garamond", serif' }}
            >
              fitzy
            </p>
            <p
              className="text-[22px] font-semibold tracking-[0.35em]"
              style={{ fontFamily: '"Cormorant Garamond", "Cinzel", "Playfair Display", serif' }}
            >
              ¡Bienvenido de vuelta!
            </p>
            <p
              className="text-sm text-white/80 leading-relaxed font-light"
              style={{ fontFamily: '"Space Grotesk","Inter",sans-serif' }}
            >
              Accede a un ecosistema diseñado para mentes visionarias: sobrio, táctil
              y con la calma del azul característico de Fitzy.
            </p>
          </div>

          {serverError ? (
            <p className="mt-6 text-sm text-white bg-red-500/60 border border-red-50/50 rounded-2xl py-2 px-4 text-center">
              {serverError}
            </p>
          ) : null}

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
            <div className="space-y-2">
              <label className="text-[11px] tracking-[0.35em] uppercase text-white/70">
                Email
              </label>
              <input
                className="w-full rounded-full border border-white/70 bg-white/10 px-5 py-3 text-base placeholder-white/70 focus:bg-white/20 focus:ring-2 focus:ring-white/80 focus:border-white outline-none transition"
                type="email"
                placeholder="nombre@email.com"
                {...register('email')}
              />
              {errors.email ? (
                <p className="text-xs text-red-100">{errors.email.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-[11px] tracking-[0.35em] uppercase text-white/70">
                Contraseña
              </label>
              <input
                className="w-full rounded-full border border-white/70 bg-white/10 px-5 py-3 text-base placeholder-white/70 focus:bg-white/20 focus:ring-2 focus:ring-white/80 focus:border-white outline-none transition"
                type="password"
                placeholder="••••••••"
                {...register('password')}
              />
              {errors.password ? (
                <p className="text-xs text-red-100">{errors.password.message}</p>
              ) : null}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                className="text-xs font-semibold text-white/75 hover:text-white transition"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-full text-base font-semibold bg-white text-[#51677b] tracking-[0.25em] uppercase shadow-[0_20px_45px_rgba(255,255,255,0.35)] hover:bg-[#f8fbff] transition disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={mutation.isLoading}
            >
              {mutation.isLoading ? 'Ingresando...' : 'Ingresar'}
            </button>

            <button
              type="button"
              className="w-full py-3 rounded-full border border-white/40 text-sm font-medium text-white/90 hover:bg-white/10 transition"
              onClick={handleDemoLogin}
            >
              Probar la versión demo
            </button>
          </form>

          <div className="flex items-center gap-4 my-8 text-[10px] uppercase tracking-[0.5em] text-white/60">
            <span className="flex-1 h-px bg-white/35" />
            o
            <span className="flex-1 h-px bg-white/35" />
          </div>

          <div className="space-y-3">
            <button
              type="button"
              className="w-full py-3 rounded-full border border-white/70 flex items-center justify-center gap-3 text-white/95 hover:bg-white/10 transition"
            >
              <span className="h-6 w-6 rounded-full bg-white text-[#96b5c9] font-semibold flex items-center justify-center">
                G
              </span>
              Continuar con Google
            </button>
            <button
              type="button"
              className="w-full py-3 rounded-full border border-white/70 flex items-center justify-center gap-3 text-white/95 hover:bg-white/10 transition"
            >
              <span className="text-2xl leading-none"></span>
              Continuar con Apple
            </button>
          </div>

          <div className="mt-8 text-center text-sm text-white/80">
            ¿No tienes cuenta?{' '}
            <button
              type="button"
              className="font-semibold underline-offset-4 hover:underline"
              onClick={() => navigate('/signup', { state: { from: fromState } })}
            >
              Regístrate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
