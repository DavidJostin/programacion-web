# WP-4 · AWS API Gateway

Infraestructura en AWS definida con CloudFormation (`api-gateway.yaml`).

```
Cliente ──HTTPS──▶ API Gateway (HTTP API) ──HTTP + X-Gateway-Secret──▶ EC2 (Elastic IP)
                    · 5 rutas /api/products          └─ docker compose
                    · CORS                               ├─ app  (Spring Boot :8080 → :80)
                    · throttling 20 req/s                └─ db   (PostgreSQL 16, sin puerto público)
                    · logs en CloudWatch
```

## Qué crea el stack

| Recurso | Para qué |
|---|---|
| `BackendSecurityGroup` | Abre 80 (HTTP) y 22 (SSH) en la EC2 |
| `BackendInstance` | EC2 Amazon Linux 2023; al arrancar instala Docker, clona el repo y corre `docker compose up -d --build` |
| `BackendEip` | IP fija: el Learner Lab apaga la EC2 al cerrar la sesión y sin esto cambiaría la IP |
| `HttpApi` | El API Gateway (tipo HTTP API) con CORS |
| `*Integration` | A dónde reenvía cada petición (`HTTP_PROXY` hacia la EC2) |
| `*Route` | Las 5 rutas públicas; cualquier otra devuelve 404 desde el Gateway |
| `DefaultStage` | Publica la API (auto deploy), throttling y logs de acceso |
| `ApiAccessLogs` | Log group `/programacion-web/api-gateway` (7 días) |

### Rutas expuestas

| Método | Ruta en el Gateway | Se reenvía a la EC2 |
|---|---|---|
| GET | `/api/products` | `/api/products` |
| POST | `/api/products` | `/api/products` |
| GET | `/api/products/{id}` | `/api/products/{id}` |
| PUT | `/api/products/{id}` | `/api/products/{id}` |
| DELETE | `/api/products/{id}` | `/api/products/{id}` |

## Despliegue en AWS Academy Learner Lab

1. **Start Lab** y espera el punto verde → clic en **AWS**.
2. Revisa que la región sea **us-east-1 (N. Virginia)**.
3. Ve a **CloudFormation → Create stack → With new resources (standard)**.
4. **Upload a template file** → elige `infra/api-gateway.yaml` → *Next*.
5. Stack name: `programacion-web`. Parámetros:
   - `DbPassword`: una contraseña de 8+ caracteres (no la subas a Git).
   - `GatewaySecret`: 32+ letras/números al azar. Genéralo en Git Bash con `openssl rand -hex 32`
     y **no lo subas a Git**. Lo usa el Gateway para que la EC2 sepa que la petición viene de él.
   - `GitBranch`: `test` (o la rama que quieras desplegar; tiene que estar en GitHub).
   - El resto, con sus valores por defecto.
6. *Next* → *Next* → **Submit**. Espera `CREATE_COMPLETE` (~3 min).
7. En la pestaña **Outputs** copia `ApiUrl`.
8. **Espera 5–8 minutos más**: la EC2 todavía está compilando la imagen Docker.
   Mientras tanto el Gateway responde `503 Service Unavailable`. Es normal.

## Probar

```bash
# Reemplaza por tu ApiUrl
API=https://abc123.execute-api.us-east-1.amazonaws.com/api/products

curl $API                                   # listar
curl $API/1                                 # obtener uno
curl -X POST $API -H "Content-Type: application/json" \
     -d '{"name":"Teclado","price":25.5,"stock":10}'          # crear (201)
curl -X PUT $API/1 -H "Content-Type: application/json" \
     -d '{"name":"Teclado RGB","price":30,"stock":5}'         # actualizar
curl -X DELETE $API/1                       # eliminar (204)

curl -i https://abc123.execute-api.us-east-1.amazonaws.com/h2-console  # 404: ruta no declarada en el Gateway
```

### Prueba: el backend solo acepta peticiones que vienen del Gateway

```bash
# Reemplaza por tus Outputs: ApiUrl y la IP de BackendUrl
API=https://abc123.execute-api.us-east-1.amazonaws.com/api/products
EC2=http://54.0.0.1

# 1) Directo a la EC2, sin header → 403
curl -i $EC2/api/products
# HTTP/1.1 403
# {"error":"Forbidden: use the API Gateway URL"}

# 2) Directo a la EC2 con un secreto inventado → 403
curl -i -H "X-Gateway-Secret: adivinado" $EC2/api/products
# HTTP/1.1 403

# 3) Por el Gateway, sin mandar ningún header → 200
curl -i $API
# HTTP/2 200
# [{"id":1,"name":"Laptop Pro 14",...}]
```

Por qué: en la prueba 3 el cliente tampoco manda el secreto; lo **agrega el Gateway** en el tramo
Gateway → EC2 (`overwrite:header.X-Gateway-Secret` en `api-gateway.yaml`). La app lo compara con
`GATEWAY_SECRET` en `GatewaySecretFilter` y deja pasar solo si coincide.

En **CloudWatch → Log groups → /programacion-web/api-gateway** se ve una línea por cada petición
(método, ruta, status, latencia, status del backend).

## Problemas comunes

| Síntoma | Causa / solución |
|---|---|
| `503` justo después de crear el stack | La app aún se está construyendo; espera unos minutos |
| `503` siempre | Entra por SSH y revisa `sudo tail -100 /var/log/cloud-init-output.log` y `sudo docker compose -f /opt/app/docker-compose.yml ps` |
| `403` también por el Gateway | El secreto de la EC2 no coincide con el del Gateway. Pasa si cambias `GatewaySecret` con *Update*: el user data solo corre en el primer arranque. Por SSH edita `GATEWAY_SECRET` en `/opt/app/.env` y corre `sudo docker compose up -d` |
| `429 Too Many Requests` | Se superó el throttling (20 req/s); es el Gateway protegiendo al backend |
| No responde tras reabrir el lab | La EC2 se está prendiendo; Docker levanta solo (`restart: unless-stopped`) |

SSH (key `vockey`: descárgala en *AWS Details → Download PEM*):

```bash
ssh -i labsuser.pem ec2-user@<IP de BackendUrl>
```

## Actualizar o borrar

- **Nueva versión del código:** por SSH → `cd /opt/app && sudo git pull && sudo docker compose up -d --build`.
- **Cambios en la plantilla:** CloudFormation → stack → *Update* → *Replace current template*.
- **Borrar todo** (para no gastar créditos): CloudFormation → stack → *Delete*.

## Limitaciones (decisiones conscientes)

- El puerto 80 de la EC2 sigue abierto a Internet (HTTP API llega por IPs públicas de AWS), pero
  `/api/**` responde 403 sin el header `X-Gateway-Secret`. Se eligió esto en vez de VPC Link + Load
  Balancer privado, que cerraría el puerto del todo pero consume más créditos del Learner Lab.
- El frontend estático (`http://<IP>/`) sigue accesible, pero sus llamadas a `/api` reciben 403
  porque el navegador no conoce el secreto. La API pública es la URL del Gateway.
- La contraseña de la base y el `GatewaySecret` viajan en el *user data* de la EC2 y el secreto
  queda visible en la configuración del Gateway (para quien tenga acceso a la cuenta AWS).
  En producción irían en Secrets Manager.
- En local (sin `GATEWAY_SECRET`) el filtro se apaga y la app avisa con un WARN al arrancar.
- El tráfico Gateway → EC2 es HTTP (sin TLS); el cliente → Gateway sí es HTTPS.
