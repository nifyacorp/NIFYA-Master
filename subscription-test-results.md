# NIFYA Subscription Creation Test Results

## Test Started
Timestamp: 2025-03-21T16:01:49.261Z

## Console LOG Message
```
API base URL being used: /api
```

## Console LOG Message
```
VITE_SUBSCRIPTION_WORKER: https://subscription-worker-415554190254.us-central1.run.app
```

## Console LOG Message
```
Auth state in header updated: JSHandle@object
```

## Console STARTGROUP Message
```
Notifications API - list
```

## Console LOG Message
```
Listing notifications with options: JSHandle@object
```

## Console STARTGROUP Message
```
🌐 API Request: GET /api/v1/notifications?page=1&limit=1&unread=true
```

## Console LOG Message
```
Request details: JSHandle@object
```

## Console LOG Message
```
Auth headers: JSHandle@object
```

## Console LOG Message
```
Final request options: JSHandle@object
```

## Console LOG Message
```
AuthContext: Checking auth state JSHandle@object
```

## Console LOG Message
```
Response received: JSHandle@object
```

## Console LOG Message
```
Parsed JSON response: JSHandle@object
```

## Console ERROR Message
```
API error response: MISSING_HEADERS
```

## Console LOG Message
```
Final API response object: JSHandle@object
```

## Console LOG Message
```
Raw API response received: JSHandle@object
```

## Console ERROR Message
```
Invalid response format - missing notifications array JSHandle@object
```

## Network Response
```
Status: 401
URL: https://clever-kelpie-60c3a6.netlify.app/api/v1/notifications?page=1&limit=1&unread=true
Body: {
  "error": "MISSING_HEADERS",
  "message": "Invalid Authorization header format. Must be: Bearer <token>",
  "status": 401,
  "details": {},
  "timestamp": "2025-03-21T16:01:50.540Z"
}
```


![1-login-page](screenshots\1-login-page-1742572910828.png)


![2-login-form-filled](screenshots\2-login-form-filled-1742572911089.png)

## Console LOG Message
```
Login attempt: JSHandle@object
```

## Console LOG Message
```
Request Details: JSHandle@object
```

## Console LOG Message
```
Response: JSHandle@object
```

## Console LOG Message
```
API base URL being used: /api
```

## Console LOG Message
```
VITE_SUBSCRIPTION_WORKER: https://subscription-worker-415554190254.us-central1.run.app
```

## Console LOG Message
```
Auth state in header updated: JSHandle@object
```

## Console STARTGROUP Message
```
Notifications API - list
```

## Console LOG Message
```
Listing notifications with options: JSHandle@object
```

## Console STARTGROUP Message
```
🌐 API Request: GET /api/v1/notifications?page=1&limit=1&unread=true
```

## Console LOG Message
```
Request details: JSHandle@object
```

## Console LOG Message
```
Auth headers: JSHandle@object
```

## Console LOG Message
```
Final request options: JSHandle@object
```

## Console LOG Message
```
AuthContext: Checking auth state JSHandle@object
```

## Console STARTGROUP Message
```
🌐 API Request: GET /api/v1/users/me
```

## Console LOG Message
```
Request details: JSHandle@object
```

## Console LOG Message
```
Auth headers: JSHandle@object
```

## Console LOG Message
```
Final request options: JSHandle@object
```

## Console LOG Message
```
Response received: JSHandle@object
```

## Console LOG Message
```
Response received: JSHandle@object
```

## Console LOG Message
```
Parsed JSON response: JSHandle@object
```

## Console LOG Message
```
Final API response object: JSHandle@object
```

## Console LOG Message
```
AuthContext: User loaded from API JSHandle@object
```

## Console LOG Message
```
Parsed JSON response: JSHandle@object
```

## Console LOG Message
```
Processing notification response: JSHandle@object
```

## Console LOG Message
```
Final API response object: JSHandle@object
```

## Console LOG Message
```
Raw API response received: JSHandle@object
```

## Console LOG Message
```
Processed notifications: JSHandle@object
```

## Console LOG Message
```
Auth state in header updated: JSHandle@object
```

## Console LOG Message
```
Notifications API - list
```

## Console LOG Message
```
Listing notifications with options: JSHandle@object
```

## Console STARTGROUP Message
```
Notifications API - list
```

## Console LOG Message
```
Listing notifications with options: JSHandle@object
```

## Console STARTGROUP Message
```
🌐 API Request: GET /api/v1/notifications?page=1&limit=1&unread=true
```

## Console LOG Message
```
Request details: JSHandle@object
```

## Console LOG Message
```
Auth headers: JSHandle@object
```

## Console LOG Message
```
Final request options: JSHandle@object
```

## Console LOG Message
```
Current auth state: JSHandle@object
```

## Console LOG Message
```
Step 2: Fetching user profile from API
```

## Console STARTGROUP Message
```
🌐 API Request: GET /api/v1/users/me
```

## Console LOG Message
```
Request details: JSHandle@object
```

## Console LOG Message
```
Auth headers: JSHandle@object
```

## Console LOG Message
```
Final request options: JSHandle@object
```

## Console LOG Message
```
Request details: JSHandle@object
```

## Console LOG Message
```
Auth headers: JSHandle@object
```

## Console LOG Message
```
Final request options: JSHandle@object
```

## Console LOG Message
```
Request details: JSHandle@object
```

## Console LOG Message
```
Auth headers: JSHandle@object
```

## Console LOG Message
```
Final request options: JSHandle@object
```

## Console LOG Message
```
Request details: JSHandle@object
```

## Console LOG Message
```
Auth headers: JSHandle@object
```

## Console LOG Message
```
Final request options: JSHandle@object
```

## Console LOG Message
```
Request details: JSHandle@object
```

## Console LOG Message
```
Auth headers: JSHandle@object
```

## Console LOG Message
```
Final request options: JSHandle@object
```

## Network Request
```
Method: GET
URL: https://clever-kelpie-60c3a6.netlify.app/api/v1/subscriptions
Data: None
```

## Network Request
```
Method: GET
URL: https://clever-kelpie-60c3a6.netlify.app/api/v1/subscriptions/stats
Data: None
```

## Console LOG Message
```
Response received: JSHandle@object
```

## Console LOG Message
```
Response received: JSHandle@object
```

## Console LOG Message
```
Parsed JSON response: JSHandle@object
```

## Console LOG Message
```
Final API response object: JSHandle@object
```

## Console LOG Message
```
Response received: JSHandle@object
```

## Console LOG Message
```
Parsed JSON response: JSHandle@object
```

## Console LOG Message
```
Final API response object: JSHandle@object
```

## Console LOG Message
```
Response received: JSHandle@object
```

## Console LOG Message
```
Response received: JSHandle@object
```

## Console LOG Message
```
Parsed JSON response: JSHandle@object
```

## Console LOG Message
```
Final API response object: JSHandle@object
```

## Console LOG Message
```
Parsed JSON response: JSHandle@object
```

## Console LOG Message
```
Processing notification response: JSHandle@object
```

## Console LOG Message
```
Final API response object: JSHandle@object
```

## Console LOG Message
```
Raw API response received: JSHandle@object
```

## Console LOG Message
```
Processed notifications: JSHandle@object
```

## Network Response
```
Status: 200
URL: https://clever-kelpie-60c3a6.netlify.app/api/v1/subscriptions/stats
Body: {
  "total": 1,
  "active": 1,
  "inactive": 0,
  "bySource": {
    "BOE": 1
  },
  "byFrequency": {
    "immediate": 1
  }
}
```

## Console LOG Message
```
Parsed JSON response: JSHandle@object
```

## Console LOG Message
```
Final API response object: JSHandle@object
```

## Console LOG Message
```
Step 3: Processing API response
```

## Console LOG Message
```
Response data: JSHandle@object
```

## Network Response
```
Status: 200
URL: https://clever-kelpie-60c3a6.netlify.app/api/v1/subscriptions
Body: {
  "status": "success",
  "data": {
    "subscriptions": [],
    "pagination": {
      "total": 0,
      "page": 1,
      "limit": 20,
      "totalPages": 0
    }
  }
}
```

## Console LOG Message
```
Response received: JSHandle@object
```

## Console LOG Message
```
Parsed JSON response: JSHandle@object
```

## Console LOG Message
```
Final API response object: JSHandle@object
```

## Console LOG Message
```
Processing notification response: JSHandle@object
```

## Console LOG Message
```
Raw API response received: JSHandle@object
```

## Console LOG Message
```
Processed notifications: JSHandle@object
```

## Console LOG Message
```
Request details: JSHandle@object
```

## Console LOG Message
```
Auth headers: JSHandle@object
```

## Console LOG Message
```
Final request options: JSHandle@object
```

## Console LOG Message
```
Response received: JSHandle@object
```

## Console LOG Message
```
Parsed JSON response: JSHandle@object
```

## Console LOG Message
```
Final API response object: JSHandle@object
```


![3-after-login](screenshots\3-after-login-1742572913714.png)

## Console LOG Message
```
API base URL being used: /api
```

## Console LOG Message
```
VITE_SUBSCRIPTION_WORKER: https://subscription-worker-415554190254.us-central1.run.app
```

## Console LOG Message
```
Auth state in header updated: JSHandle@object
```

## Console STARTGROUP Message
```
Notifications API - list
```

## Console LOG Message
```
Listing notifications with options: JSHandle@object
```

## Console STARTGROUP Message
```
🌐 API Request: GET /api/v1/notifications?page=1&limit=1&unread=true
```

## Console LOG Message
```
Request details: JSHandle@object
```

## Console LOG Message
```
Auth headers: JSHandle@object
```

## Console LOG Message
```
Final request options: JSHandle@object
```

## Console LOG Message
```
AuthContext: Checking auth state JSHandle@object
```

## Console STARTGROUP Message
```
🌐 API Request: GET /api/v1/users/me
```

## Console LOG Message
```
Request details: JSHandle@object
```

## Console LOG Message
```
Auth headers: JSHandle@object
```

## Console LOG Message
```
Final request options: JSHandle@object
```

## Console LOG Message
```
Response received: JSHandle@object
```

## Console LOG Message
```
Parsed JSON response: JSHandle@object
```

## Console LOG Message
```
Final API response object: JSHandle@object
```

## Console LOG Message
```
AuthContext: User loaded from API JSHandle@object
```

## Console LOG Message
```
Auth state in header updated: JSHandle@object
```

## Console STARTGROUP Message
```
🌐 API Request: GET /api/v1/templates/boe-general
```

## Console LOG Message
```
Request details: JSHandle@object
```

## Console LOG Message
```
Auth headers: JSHandle@object
```

## Console LOG Message
```
Final request options: JSHandle@object
```

## Console STARTGROUP Message
```
Notifications API - list
```

## Console LOG Message
```
Listing notifications with options: JSHandle@object
```

## Console STARTGROUP Message
```
🌐 API Request: GET /api/v1/notifications?page=1&limit=1&unread=true
```

## Console LOG Message
```
Request details: JSHandle@object
```

## Network Request
```
Method: GET
URL: https://clever-kelpie-60c3a6.netlify.app/api/v1/templates/boe-general
Data: None
```

## Console LOG Message
```
Auth headers: JSHandle@object
```

## Console LOG Message
```
Final request options: JSHandle@object
```

## Console LOG Message
```
Current auth state: JSHandle@object
```

## Console LOG Message
```
Step 2: Fetching user profile from API
```

## Console STARTGROUP Message
```
🌐 API Request: GET /api/v1/users/me
```

## Console LOG Message
```
Request details: JSHandle@object
```

## Console LOG Message
```
Auth headers: JSHandle@object
```

## Console LOG Message
```
Final request options: JSHandle@object
```

## Console LOG Message
```
Response received: JSHandle@object
```

## Console LOG Message
```
Parsed JSON response: JSHandle@object
```

## Console LOG Message
```
Processing notification response: JSHandle@object
```

## Console LOG Message
```
Final API response object: JSHandle@object
```

## Console LOG Message
```
Raw API response received: JSHandle@object
```

## Console LOG Message
```
Processed notifications: JSHandle@object
```

## Console LOG Message
```
Response received: JSHandle@object
```

## Console LOG Message
```
Response received: JSHandle@object
```

## Console LOG Message
```
Response received: JSHandle@object
```

## Console LOG Message
```
Parsed JSON response: JSHandle@object
```

## Console LOG Message
```
Final API response object: JSHandle@object
```

## Console LOG Message
```
Step 3: Processing API response
```

## Console LOG Message
```
Response data: JSHandle@object
```

## Console LOG Message
```
Parsed JSON response: JSHandle@object
```

## Console LOG Message
```
Final API response object: JSHandle@object
```

## Console LOG Message
```
Parsed JSON response: JSHandle@object
```

## Console LOG Message
```
Processing notification response: JSHandle@object
```

## Console LOG Message
```
Final API response object: JSHandle@object
```

## Console LOG Message
```
Raw API response received: JSHandle@object
```

## Console LOG Message
```
Processed notifications: JSHandle@object
```

## Network Response
```
Status: 200
URL: https://clever-kelpie-60c3a6.netlify.app/api/v1/templates/boe-general
Body: {
  "template": {
    "id": "boe-general",
    "name": "BOE General",
    "description": "Seguimiento general del Boletín Oficial del Estado",
    "type": "boe",
    "prompts": [
      "disposición",
      "ley",
      "real decreto"
    ],
    "icon": "GanttChart",
    "logo": "https://www.boe.es/favicon.ico",
    "metadata": {
      "category": "government",
      "source": "boe"
    },
    "isBuiltIn": true,
    "frequency": "daily"
  }
}
```


![4-boe-form](screenshots\4-boe-form-1742572915728.png)

## Form Structure
```json
{
  "hasForm": true,
  "textareaInfo": {
    "placeholder": "Describe lo que quieres monitorizar...",
    "value": "",
    "id": "",
    "name": "",
    "classes": [
      "w-full",
      "h-32",
      "px-4",
      "py-3",
      "rounded-lg",
      "border",
      "bg-background",
      "focus:outline-none",
      "focus:ring-2",
      "focus:ring-primary/50",
      "resize-none",
      "pr-10"
    ]
  },
  "submitButtonInfo": {
    "text": "Crear Suscripción",
    "id": "create-subscription-button",
    "classes": [
      "inline-flex",
      "items-center",
      "justify-center",
      "whitespace-nowrap",
      "rounded-md",
      "text-sm",
      "font-medium",
      "transition-colors",
      "focus-visible:outline-none",
      "focus-visible:ring-1",
      "focus-visible:ring-ring",
      "disabled:pointer-events-none",
      "disabled:opacity-50",
      "bg-primary",
      "text-primary-foreground",
      "shadow",
      "hover:bg-primary/90",
      "h-9",
      "px-4",
      "py-2",
      "w-full",
      "sm:w-auto"
    ],
    "disabled": false
  },
  "formHTML": "<form class=\"mt-6\" id=\"subscription-form\"><div class=\"rounded-lg border bg-card text-card-foreground shadow-sm mb-6\"><div class=\"flex flex-col space-y-1.5 p-6\"><h3 class=\"font-semibold tracking-tight text-lg\">¿Qué quieres monitorizar? (1/3)</h3><p class=\"text-sm text-muted-foreground\">Describe con el mayor detalle posible lo que quieres que NIFYA busque para ti.</p></div><div class=\"p-6 pt-0 space-y-4\"><div class=\"relative\"><textarea placeholder=\"Describe lo que quieres monitorizar...\" class=\"w-full h-32 px-4 py-3 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none pr-10\" required=\"\"></textarea></div><button class=\"inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 mt-2\" type=\"button\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-plus h-4 w-4 mr-2\"><path d=\"M5 12h14\"></path><path d=\"M12 5v14\"></path></svg>Añadir otro prompt</button></div></div><div class=\"rounded-lg border bg-card text-card-foreground shadow-sm mb-6\"><div class=\"flex flex-col space-y-1.5 p-6\"><h3 class=\"font-semibold tracking-tight text-lg\">Frecuencia de notificaciones</h3><p class=\"text-sm text-muted-foreground\">¿Con qué frecuencia quieres recibir las notificaciones?</p></div><div class=\"p-6 pt-0\"><div class=\"grid grid-cols-1 md:grid-cols-2 gap-4\"><div class=\"flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all bg-primary/10 border-primary\"><div class=\"p-2 rounded-full bg-primary/20\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-bell h-5 w-5 text-primary\"><path d=\"M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9\"></path><path d=\"M10.3 21a1.94 1.94 0 0 0 3.4 0\"></path></svg></div><div class=\"text-left\"><p class=\"font-medium\">Inmediata</p><p class=\"text-sm text-muted-foreground\">Recibe notificaciones tan pronto como haya coincidencias</p></div></div><div class=\"flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all bg-card hover:bg-muted/50\"><div class=\"p-2 rounded-full bg-muted\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-clock h-5 w-5 text-muted-foreground\"><circle cx=\"12\" cy=\"12\" r=\"10\"></circle><polyline points=\"12 6 12 12 16 14\"></polyline></svg></div><div class=\"text-left\"><p class=\"font-medium\">Diaria</p><p class=\"text-sm text-muted-foreground\">Recibe un resumen diario con todas las coincidencias</p></div></div></div></div></div><div class=\"rounded-lg border bg-card text-card-foreground shadow-sm\"><div class=\"p-6 pt-6\"><div class=\"flex flex-col sm:flex-row gap-4 justify-between\"><button class=\"inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2\" type=\"button\">Cancelar</button><button class=\"inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2 w-full sm:w-auto\" type=\"submit\" data-testid=\"create-subscription-button\" id=\"create-subscription-button\">Crear Suscripción</button></div></div></div></form>"
}
```


![5-prompt-filled](screenshots\5-prompt-filled-1742572915905.png)

## Console STARTGROUP Message
```
🌐 API Request: GET /api/v1/templates?page=1&limit=20
```

## Console LOG Message
```
Request details: JSHandle@object
```

## Console LOG Message
```
Auth headers: JSHandle@object
```

## Console LOG Message
```
Final request options: JSHandle@object
```

## Network Request
```
Method: GET
URL: https://clever-kelpie-60c3a6.netlify.app/api/v1/templates?page=1&limit=20
Data: None
```

## Submit Button Click
```json
{
  "clicked": true,
  "buttonText": "Crear Suscripción",
  "wasDisabled": false,
  "type": "submit"
}
```

## Console LOG Message
```
Response received: JSHandle@object
```

## Console LOG Message
```
Parsed JSON response: JSHandle@object
```

## Console LOG Message
```
Final API response object: JSHandle@object
```

## Console STARTGROUP Message
```
📋 Subscription List Request
```

## Console LOG Message
```
Fetching subscriptions...
```

## Console STARTGROUP Message
```
🌐 API Request: GET /api/v1/subscriptions
```

## Console LOG Message
```
Request details: JSHandle@object
```

## Console LOG Message
```
Auth headers: JSHandle@object
```

## Console LOG Message
```
Final request options: JSHandle@object
```

## Network Request
```
Method: GET
URL: https://clever-kelpie-60c3a6.netlify.app/api/v1/subscriptions
Data: None
```

## Network Response
```
Status: 200
URL: https://clever-kelpie-60c3a6.netlify.app/api/v1/templates?page=1&limit=20
Body: {
  "templates": [
    {
      "id": "boe-general",
      "name": "BOE General",
      "description": "Seguimiento general del Boletín Oficial del Estado",
      "type": "boe",
      "prompts": [
        "disposición",
        "ley",
        "real decreto"
      ],
      "icon": "GanttChart",
      "logo": "https://www.boe.es/favicon.ico",
      "metadata": {
        "category": "government",
        "source": "boe"
      },
      "isBuiltIn": true,
      "frequency": "daily"
    },
    {
      "id": "boe-subvenciones",
      "name": "Subvenciones BOE",
      "description": "Alertas de subvenciones y ayudas públicas",
      "type": "boe",
      "prompts": [
        "subvención",
        "ayuda",
        "convocatoria"
      ],
      "icon": "Coins",
      "logo": "https://www.boe.es/favicon.ico",
      "metadata": {
        "category": "government",
        "source": "boe"
      },
      "isBuiltIn": true,
      "frequency": "immediate"
    },
    {
      "id": "real-estate-rental",
      "name": "Alquiler de Viviendas",
      "description": "Búsqueda de alquileres en zonas específicas",
      "type": "real-estate",
      "prompts": [
        "alquiler",
        "piso",
        "apartamento"
      ],
      "icon": "Key",
      "logo": "https://cdn-icons-png.flaticon.com/512/1040/1040993.png",
      "metadata": {
        "category": "real-estate",
        "source": "property-listings"
      },
      "isBuiltIn": true,
      "frequency": "immediate"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalPages": 1,
    "totalCount": 3,
    "hasMore": false
  }
}
```

## Console LOG Message
```
Response received: JSHandle@object
```

## Console LOG Message
```
Parsed JSON response: JSHandle@object
```

## Console LOG Message
```
Final API response object: JSHandle@object
```

## Network Response
```
Status: 200
URL: https://clever-kelpie-60c3a6.netlify.app/api/v1/subscriptions
Body: {
  "status": "success",
  "data": {
    "subscriptions": [],
    "pagination": {
      "total": 0,
      "page": 1,
      "limit": 20,
      "totalPages": 0
    }
  }
}
```


![6-after-submit](screenshots\6-after-submit-1742572926602.png)

## Form Status After Submission
```json
{
  "currentUrl": "https://clever-kelpie-60c3a6.netlify.app/subscriptions/new",
  "hasErrors": false,
  "errors": [],
  "hasSuccess": false,
  "success": [],
  "pageTitle": "NIFYA - Notificaciones inteligentes impulsadas por IA",
  "bodyText": "NIFYA\nDashboard\nSubscriptions\nU\nNIFYA\n\nNotificaciones Inteligentes\n\nTest\n\nratonxi@gmail.com\n\nInicio\nNotificaciones\nSubscripciones\nAjustes\nCerrar sesión\nBack to Subscriptions\nCreate New Subscription\nYour Subscriptions\n\nYou don't have any subscriptions yet.\n\nView All Subscriptions\nAvailable Templates\nBOE General\n\nSeguimiento general del Boletín Oficial del Estado\n\nGet notifications for new publications in the Spanish Official State Gazette (BOE) based on your keywords and filters.\n\nDefault prompts"
}
```


![7-final-state](screenshots\7-final-state-1742572934826.png)


## Test Completed
Timestamp: 2025-03-21T16:02:15.033Z

