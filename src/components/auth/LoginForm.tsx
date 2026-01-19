/**
 * Componente de inicio de sesión
 */
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { Button } from '../ui/button'
import { InputGroup } from '../ui/input-group'
import { Card } from '../ui/card'
import { Field, FieldLabel, FieldContent, FieldError } from '../ui/field'
import { useAuthStore } from '../../stores/authStore'

/**
 * Schema de validación para el formulario de login
 */
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El correo es requerido')
    .email('Ingresa un correo válido'),
  password: z
    .string()
    .min(1, 'La contraseña es requerida')
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [loginError, setLoginError] = useState<string>()
  const { signIn, isLoading } = useAuthStore()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  /**
   * Maneja el envío del formulario de login
   */
  const onSubmit = async (data: LoginFormData) => {
    setLoginError(undefined)
    
    const result = await signIn(data.email, data.password)
    
    if (result.error) {
      setLoginError(result.error)
    }
  }

  const isFormLoading = isSubmitting || isLoading

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Iniciar Sesión
          </h1>
          <p className="text-gray-600">
            Ingresa tus credenciales para acceder a VeraTasks
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field>
            <FieldLabel htmlFor="email">
              Correo electrónico
            </FieldLabel>
            <FieldContent>
              <InputGroup>
                <input
                  {...register('email')}
                  id="email"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  className="w-full"
                  disabled={isFormLoading}
                />
              </InputGroup>
              {errors.email && (
                <FieldError>{errors.email.message}</FieldError>
              )}
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor="password">
              Contraseña
            </FieldLabel>
            <FieldContent>
              <InputGroup>
                <input
                  {...register('password')}
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Tu contraseña"
                  className="w-full pr-10"
                  disabled={isFormLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-auto p-1"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isFormLoading}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-gray-500" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-500" />
                  )}
                </Button>
              </InputGroup>
              {errors.password && (
                <FieldError>{errors.password.message}</FieldError>
              )}
            </FieldContent>
          </Field>

          {loginError && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {loginError}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isFormLoading}
          >
            {isFormLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Iniciando sesión...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <LogIn className="w-4 h-4" />
                Iniciar Sesión
              </div>
            )}
          </Button>
        </form>
      </Card>
    </div>
  )
}