import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthProvider';

const schema = z.object({
  firstName: z.string().min(1, { message: 'Nombre es requerido' }),
  lastName: z.string().min(1, { message: 'Apellido es requerido' }),
  email: z
    .string()
    .email({ message: 'Email inválido' })
    .min(1, { message: 'Email es requerido' }),
  password: z
    .string()
    .min(8, { message: 'La contraseña debe tener al menos 8 caracteres' }),
});

export default function Register() {
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
      firstName: '',
      lastName: '',
      email: '',
      password: '',
    },
  });

  const mutation = useMutation({
    mutationFn: async ({ firstName, lastName, email, password }) =>
      auth.register({
        firstName,
        lastName,
        email,
        password,
        deviceName: 'consumer-web',
      }),
    onSuccess: (user) => {
      queryClient.setQueryData(['currentUser'], user);
      navigate(redirectPath, { replace: true });
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.message ??
        err?.message ??
        'No se pudo crear la cuenta';
      setServerError(msg);
    },
  });

  const onSubmit = (data) => {
    setServerError('');
    mutation.mutate({
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      email: data.email.trim().toLowerCase(),
      password: data.password,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-[#eef4f7] to-[#d5e4eb] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-5xl grid gap-12 md:grid-cols-[420px_1fr] items-center">
        <div className="bg-white/90 rounded-3xl border border-gray-200 shadow-xl shadow-[0_20px_50px_rgba(123,163,183,0.25)] px-8 py-10 order-2 md:order-1">
          <div className="flex flex-col items-center gap-2 mb-8">
            <p className="text-[rgb(123,163,183)] text-3xl font-semibold">fitzy</p>
            <p className="text-sm text-gray-500 text-center">Crea tu cuenta para empezar a reservar</p>
          </div>

          {serverError ? (
            <p className="text-sm text-red-600 mb-4 text-center">{serverError}</p>
          ) : null}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <input
                  className="w-full rounded-lg border border-gray-200 bg-gray-50/60 px-4 py-3 text-sm focus:border-[rgb(123,163,183)] focus:ring-[rgb(123,163,183)] outline-none"
                  placeholder="Nombre"
                  {...register('firstName')}
                />
                {errors.firstName ? (
                  <p className="text-xs text-red-600 mt-1">{errors.firstName.message}</p>
                ) : null}
              </div>
              <div>
                <input
                  className="w-full rounded-lg border border-gray-200 bg-gray-50/60 px-4 py-3 text-sm focus:border-[rgb(123,163,183)] focus:ring-[rgb(123,163,183)] outline-none"
                  placeholder="Apellido"
                  {...register('lastName')}
                />
                {errors.lastName ? (
                  <p className="text-xs text-red-600 mt-1">{errors.lastName.message}</p>
                ) : null}
              </div>
            </div>

            <div>
              <input
                className="w-full rounded-lg border border-gray-200 bg-gray-50/60 px-4 py-3 text-sm focus:border-[rgb(123,163,183)] focus:ring-[rgb(123,163,183)] outline-none"
                type="email"
                placeholder="Correo electrónico"
                {...register('email')}
              />
              {errors.email ? (
                <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>
              ) : null}
            </div>

            <div>
              <input
                className="w-full rounded-lg border border-gray-200 bg-gray-50/60 px-4 py-3 text-sm focus:border-[rgb(123,163,183)] focus:ring-[rgb(123,163,183)] outline-none"
                type="password"
                placeholder="Contraseña"
                {...register('password')}
              />
              {errors.password ? (
                <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>
              ) : null}
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-lg text-white font-semibold transition disabled:opacity-70 bg-[rgb(123,163,183)] hover:bg-[rgb(107,145,165)]"
              disabled={mutation.isLoading}
            >
              {mutation.isLoading ? 'Creando...' : 'Crear cuenta'}
            </button>

            <p className="text-xs text-gray-400 text-center">
              Al continuar aceptas nuestras condiciones de servicio y política de privacidad.
            </p>
          </form>

          <div className="mt-8 text-center text-sm text-gray-500">
            ¿Ya tienes cuenta?{' '}
            <button
              type="button"
              className="text-[rgb(123,163,183)] font-semibold"
              onClick={() => navigate('/login', { state: { from: fromState } })}
            >
              Inicia sesión
            </button>
          </div>
        </div>

        <div className="order-1 md:order-2 text-center md:text-left">
          <p className="text-sm uppercase tracking-[0.5em] text-gray-400 mb-4">Club social</p>
          <h2 className="text-4xl md:text-5xl font-semibold text-gray-900 mb-5">
            Únete a una comunidad que reserva más y mejor.
          </h2>
          <p className="text-base text-gray-500 mb-8">
            En Fitzy todo luce como tu red social favorita, así que crear una cuenta toma segundos y reservar se vuelve parte de tu rutina.
          </p>
          <div className="grid gap-4 sm:grid-cols-3 text-left">
            {[
              { title: '6,200+', subtitle: 'Clases cada mes' },
              { title: '98%', subtitle: 'Usuarios activos semanales' },
              { title: '24/7', subtitle: 'Reservas sin fricción' },
            ].map((stat) => (
              <div key={stat.title} className="rounded-2xl bg-white/80 border border-gray-100 p-4">
                <p className="text-2xl font-semibold text-[rgb(123,163,183)]">{stat.title}</p>
                <p className="text-xs uppercase tracking-wide text-gray-400">{stat.subtitle}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
