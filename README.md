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

## 4. Seguridad

Si en algún momento vas a compartir el repo o el link ampliamente, considerá regenerar el API key en Redash y actualizar la variable de entorno en Vercel.

## Desarrollo local (opcional)

```bash
cp .env.example .env.local   # completar REDASH_API_KEY
npm install
npm run dev
```
