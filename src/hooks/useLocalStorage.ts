/**
 * Hook personalizado para gestionar localStorage
 */
import { useState } from 'react';

/**
 * Hook para gestionar datos en localStorage con tipo genérico
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // Estado para almacenar nuestro valor
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      // Obtener del localStorage local
      const item = window.localStorage.getItem(key);
      // Parsear JSON almacenado o retornar valor inicial si no existe
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // Si hay error, retornar valor inicial
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Función para actualizar el estado y localStorage
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Permitir que value sea una función para tener la misma API que useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      // Guardar el estado
      setStoredValue(valueToStore);
      // Guardar en localStorage
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      // Error más específico
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}

/**
 * Hook para limpiar un key específico del localStorage
 */
export function useClearLocalStorage() {
  const clearKey = (key: string) => {
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error clearing localStorage key "${key}":`, error);
    }
  };

  const clearAll = () => {
    try {
      window.localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  };

  return { clearKey, clearAll };
}