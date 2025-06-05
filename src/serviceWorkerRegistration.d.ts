declare module 'serviceWorkerRegistration' {
  export function register(config?: {
    onSuccess?: (registration: ServiceWorkerRegistration) => void;
    onUpdate?: (registration: ServiceWorkerRegistration) => void;
  }): void;
  
  export function unregister(): void;
} 