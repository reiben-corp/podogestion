/**
 * Listener global para eventos de actualización de configuración.
 * Permite que Dashboard y HeaderClinica se actualicen en tiempo real
 * cuando se modifican valores en Configuracion.tsx.
 */

type ConfigUpdateListener = () => void;

const listeners: Set<ConfigUpdateListener> = new Set();

export const configEvents = {
  /**
   * Suscribirse a cambios de configuración
   * @param listener Callback que se ejecuta cuando hay un cambio
   * @returns Función para cancelar la suscripción
   */
  subscribe(listener: ConfigUpdateListener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  /**
   * Notificar a todos los suscriptores que hubo un cambio
   */
  notify() {
    listeners.forEach(listener => listener());
  },
};
