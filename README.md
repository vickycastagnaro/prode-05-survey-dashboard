# Prode 05 — Survey Dashboard

Dashboard interno de resultados de la encuesta `TRIAL_CONTINUITY_2026`, con datos en vivo desde Redash (query 49747). Incluye KPIs, distribución de rating (Q1), intención de continuidad (Q2), comentarios (Q3) y filtro por instancia.

## 1. Subir a tu repo de GitHub

Desde una terminal, parado en esta carpeta:

```bash
git init
git add .
git commit -m "Dashboard inicial TRIAL_CONTINUITY_2026"
git branch -M main
git remote add origin https://github.com/vickycastagnaro/prode-05-survey-dashboard.git
git push -u origin main
```

## 2. Importar en Vercel

1. Entrá a https://vercel.com/new
2. Elegí "Import Git Repository" y seleccioná `prode-05-survey-dashboard`.
3. Framework Preset: se detecta solo como **Next.js**. No cambies nada más.
4. Antes de darle "Deploy", agregá las variables de entorno (Environment Variables):
   - `REDASH_BASE_URL` = `https://redash.humand.co`
   - `REDASH_QUERY_ID` = `49780`
   - `REDASH_API_KEY` = (el API key de la query — no lo subas nunca al repo)
5. Deploy. En 1-2 minutos tenés la URL pública (algo como `prode-05-survey-dashboard.vercel.app`).

## 3. Cómo se actualiza

- La página trae datos frescos de Redash automáticamente cada 60 segundos (cache corta).
- El botón "Actualizar ahora" fuerza una traída inmediata sin esperar el cache.
- El API key de Redash nunca se expone al navegador: todo el fetch pasa por el servidor de Next.js (`lib/redash.js` y `app/api/survey/route.js`).

## 4. Registro de descargas (Google Sheets)

Cada vez que alguien descarga el PDF, se le pide nombre y email, y esos datos —junto con la instancia/intención filtrada y la fecha— se guardan como una fila en un Google Sheet. El dashboard muestra ese historial al final de la página ("Historial de descargas").

Pasos para activarlo:

1. Entrá a https://console.cloud.google.com/ (podés usar un proyecto existente o crear uno nuevo).
2. Habilitá la **Google Sheets API** para ese proyecto (buscala en "APIs & Services" > "Library").
3. Creá una **Service Account** ("APIs & Services" > "Credentials" > "Create Credentials" > "Service Account"). No hace falta darle ningún rol especial a nivel proyecto.
4. Entrá a la Service Account creada, pestaña "Keys" > "Add Key" > "Create new key" > tipo **JSON**. Se descarga un archivo `.json` — ahí adentro están `client_email` y `private_key`.
5. Creá un Google Sheet nuevo (o usá uno existente). Renombrá una hoja (tab) a `Descargas` y en la fila 1 poné los encabezados: `Nombre | Email | Fecha | Instancia | Intención | Idioma`.
6. Compartí ese Google Sheet con el email de la Service Account (el `client_email` del paso 4), con permiso de **Editor**.
7. Copiá el ID del Sheet (la parte de la URL entre `/d/` y `/edit`).
8. En Vercel, agregá estas variables de entorno (Project Settings > Environment Variables):
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL` = el `client_email` del JSON
   - `GOOGLE_PRIVATE_KEY` = el `private_key` del JSON (pegalo completo, con los `\n`; Vercel lo interpreta bien)
   - `GOOGLE_SHEET_ID` = el ID del paso 7
9. Redeploy.

Si estas variables no están configuradas, el resto del dashboard sigue funcionando normal — el historial simplemente aparece vacío y la descarga de PDF no se ve afectada.

## 5. Seguridad

Si en algún momento vas a compartir el repo o el link ampliamente, considerá regenerar el API key en Redash y actualizar la variable de entorno en Vercel.

## Desarrollo local (opcional)

```bash
cp .env.example .env.local   # completar REDASH_API_KEY
npm install
npm run dev
```
