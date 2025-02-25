# Servicio de Notificaciones

Este servicio se encarga de recibir mensajes de PubSub relacionados con notificaciones y almacenarlos en la base de datos SQL.

## Funcionalidad principal

El servicio realiza las siguientes funciones:

1. **Escucha de mensajes PubSub**: Se suscribe al topic de PubSub `boe-analysis-notifications-sub` para recibir notificaciones.
2. **Procesamiento de mensajes**: Recibe los mensajes, los valida y extrae la información necesaria.
3. **Almacenamiento en base de datos**: Guarda las notificaciones en la tabla `notifications` de la base de datos SQL.
4. **Manejo de errores**: Implementa estrategias de reintento y manejo de errores para garantizar la fiabilidad.

## Estructura de los mensajes

Los mensajes de notificación deben tener la siguiente estructura:

```json
{
  "userId": "uuid-del-usuario",
  "subscriptionId": "uuid-de-la-suscripcion",
  "title": "Título de la notificación",
  "content": "Contenido detallado de la notificación",
  "sourceUrl": "https://ejemplo.com/fuente-original",
  "metadata": {
    "match_type": "boe",
    "relevance_score": 0.85,
    "prompt": "Texto de la consulta original"
  }
}
```

## Configuración

El servicio se configura mediante variables de entorno:

- `DB_HOST`: Host de la base de datos
- `DB_PORT`: Puerto de la base de datos
- `DB_USER`: Usuario de la base de datos
- `DB_PASSWORD`: Contraseña de la base de datos
- `DB_NAME`: Nombre de la base de datos
- `GOOGLE_CLOUD_PROJECT`: ID del proyecto de Google Cloud
- `INSTANCE_CONNECTION_NAME`: Nombre de la instancia de Cloud SQL
- `NOTIFICATION_SUBSCRIPTION`: Nombre de la suscripción de PubSub
- `PORT`: Puerto en el que escucha el servicio
- `LOG_LEVEL`: Nivel de logging
- `NODE_ENV`: Entorno de ejecución

## Instalación y ejecución

Para ejecutar el servicio:

1. Instalar dependencias:
   ```
   npm install
   ```

2. Configurar las variables de entorno (copiar .env.example a .env y editar)

3. Iniciar el servicio:
   ```
   npm start
   ```

Para desarrollo:
   ```
   npm run dev
   ```

## Endpoints API

- `/health`: Comprueba el estado del servicio, incluyendo la conexión a la base de datos.

## Integración con otros servicios

Este servicio se integra con:

1. **BOE Parser**: Recibe notificaciones de coincidencias encontradas.
2. **Frontend**: Las notificaciones almacenadas se muestran a los usuarios en la interfaz.

## Manejo de errores

- Si un mensaje no puede ser procesado, se hace `nack()` para que PubSub lo reintente.
- Todas las operaciones de base de datos se realizan dentro de transacciones.
- El servicio incluye logging detallado para facilitar la depuración. 