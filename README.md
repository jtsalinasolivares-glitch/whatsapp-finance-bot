# 🤖 Bot de Finanzas para WhatsApp

Bot conectado a la **WhatsApp Cloud API** (oficial de Meta) que te permite registrar gastos/ingresos y ver resúmenes financieros directamente desde WhatsApp.

## ¿Qué puede hacer?

- Registrar gastos e ingresos en lenguaje natural: *"gasté 20 en comida"*, *"ingreso 1200 sueldo"*
- Categorizar automáticamente (comida, transporte, vivienda, ocio, salud, ropa, educación, trabajo, otros)
- Mostrar un resumen mensual con balance y gasto por categoría (`resumen`)
- Mostrar tus últimos movimientos (`historial`)
- Deshacer el último movimiento (`borrar`)
- Fijar presupuestos mensuales por categoría (`presupuesto comida 200`) y avisarte cuando te acercas al límite

## Estructura del proyecto

```
src/
  server.js    → servidor Express + webhook de WhatsApp
  whatsapp.js  → cliente para enviar mensajes vía Graph API
  parser.js    → interpreta el lenguaje natural del usuario
  db.js        → base de datos SQLite (un archivo, sin servidor externo)
  reports.js   → genera los textos de resumen/historial
```

## 🚀 Despliegue en Railway (paso a paso)

### 1. Sube el proyecto a GitHub
```bash
git init
git add .
git commit -m "Bot de finanzas inicial"
# crea un repo en GitHub y haz push
```

### 2. Crea el proyecto en Railway
1. Entra a [railway.app](https://railway.app) y conecta tu cuenta de GitHub
2. "New Project" → "Deploy from GitHub repo" → selecciona este repo
3. Railway detecta automáticamente que es Node.js y lo despliega

### 3. Configura las variables de entorno
En Railway, ve a tu proyecto → pestaña **Variables** y añade:

| Variable | Valor |
|---|---|
| `WHATSAPP_TOKEN` | El token de acceso de tu app en Meta for Developers |
| `WHATSAPP_PHONE_NUMBER_ID` | El Phone Number ID (no el número, el ID interno) |
| `WEBHOOK_VERIFY_TOKEN` | Un string secreto que tú inventes, ej: `mi_token_super_secreto` |
| `CURRENCY` | `€` (o `$`, etc.) |

> Railway asigna `PORT` automáticamente, no necesitas configurarlo.

### 4. Obtén tu URL pública
Railway te da una URL tipo `https://tu-proyecto.up.railway.app`. Cópiala.

### 5. Configura el Webhook en Meta for Developers
1. Ve a tu app en [developers.facebook.com](https://developers.facebook.com) → WhatsApp → Configuration
2. En **Webhook**, click "Edit"
3. **Callback URL**: `https://tu-proyecto.up.railway.app/webhook`
4. **Verify Token**: el mismo valor que pusiste en `WEBHOOK_VERIFY_TOKEN`
5. Click "Verify and save" (si todo está bien configurado, debería pasar ✅)
6. En "Webhook fields", suscríbete a **messages**

### 6. ¡Pruébalo!
Escríbele un WhatsApp al número de prueba que te dio Meta. Prueba con:
```
hola
```
Deberías recibir el menú de ayuda. Luego prueba:
```
gasté 20 en comida
resumen
```

## Notas importantes

- **Token temporal vs permanente**: el token que da Meta por defecto dura 24h. Para producción, genera un **token permanente del sistema** (System User Token) desde Meta Business Suite → Configuración del negocio → Usuarios del sistema.
- **Base de datos**: usa SQLite con un archivo local (`finance.db`). En Railway esto persiste mientras no borres el servicio, pero si quieres algo más robusto a largo plazo, se puede migrar fácilmente a Postgres (Railway lo ofrece gratis también).
- **Múltiples usuarios**: el bot ya soporta múltiples números de teléfono de forma aislada (cada uno ve solo sus propios datos), así que puedes compartirlo con familiares si quieres.
- **Costos**: la ventana de conversación de WhatsApp Business es gratuita si el usuario te escribe primero (conversación "iniciada por el usuario"), que es el caso de este bot.

## Próximas mejoras posibles
- Gráficas de gastos (se pueden enviar como imagen)
- Exportar a Excel/CSV
- Recordatorios automáticos de presupuesto
- Soporte multi-moneda
