# tasks-api — Laboratorio de Kubernetes paso a paso

App mínima (Node.js + Express + Postgres) para practicar Kubernetes de punta a punta:
Deployments, Services, ConfigMaps, Secrets, PVC, probes y Ingress.

## Qué incluye

```
app/                  # código fuente + Dockerfile
k8s/
  00-namespace.yaml
  01-secret-postgres.yaml
  02-configmap-app.yaml
  03-postgres-pvc.yaml
  04-postgres-deployment.yaml
  05-postgres-service.yaml
  06-app-deployment.yaml
  07-app-service.yaml
  08-ingress.yaml
```

## Prerrequisitos

- Docker
- kubectl
- Un clúster local: **kind** o **minikube** (recomiendo kind, es más liviano)
- Ingress controller nginx (lo instalamos en el paso 4)

## Paso 1 — Crear el clúster local

Con kind:
```bash
kind create cluster --name k8s-lab
kubectl cluster-info --context kind-k8s-lab
```

## Paso 2 — Construir la imagen y cargarla en el clúster

Como el clúster es local, no hace falta un registry externo:
```bash
cd app
docker build -t tasks-api:latest .
kind load docker-image tasks-api:latest --name k8s-lab
cd ..
```
(Si usas minikube: `eval $(minikube docker-env)` y luego el `docker build` normal, o `minikube image load tasks-api:latest`.)

## Paso 3 — Aplicar los manifiestos en orden

```bash
kubectl apply -f k8s/00-namespace.yaml
kubectl apply -f k8s/01-secret-postgres.yaml
kubectl apply -f k8s/02-configmap-app.yaml
kubectl apply -f k8s/03-postgres-pvc.yaml
kubectl apply -f k8s/04-postgres-deployment.yaml
kubectl apply -f k8s/05-postgres-service.yaml
```

Verifica que Postgres quede Ready antes de seguir:
```bash
kubectl get pods -n k8s-demo -w
```
(Ctrl+C cuando veas `postgres-xxxx   1/1   Running`)

```bash
kubectl apply -f k8s/06-app-deployment.yaml
kubectl apply -f k8s/07-app-service.yaml
```

O, una vez entiendas cada archivo, puedes aplicar toda la carpeta de una vez:
```bash
kubectl apply -f k8s/
```

## Paso 4 — Instalar el Ingress controller

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=120s
```
(Si usas minikube: `minikube addons enable ingress`.)

```bash
kubectl apply -f k8s/08-ingress.yaml
```

## Paso 5 — Verificar el estado

```bash
kubectl get all -n k8s-demo
kubectl get ingress -n k8s-demo
kubectl describe pod -l app=tasks-api -n k8s-demo
kubectl logs -l app=tasks-api -n k8s-demo --tail=50
```

### Verificar por port-forward (rápido, sin tocar /etc/hosts)
```bash
kubectl port-forward svc/tasks-api 8080:80 -n k8s-demo
```
En otra terminal:
```bash
curl http://localhost:8080/health
curl http://localhost:8080/ready
curl http://localhost:8080/tasks
curl -X POST http://localhost:8080/tasks -H "Content-Type: application/json" -d '{"title":"Aprender Kubernetes"}'
```

### Verificar vía Ingress
Agrega a tu `/etc/hosts`:
```
127.0.0.1 tasks.local
```
Con kind necesitas mapear el puerto del contenedor del control-plane o usar `kubectl port-forward` sobre el Service del ingress-nginx-controller:
```bash
kubectl port-forward -n ingress-nginx svc/ingress-nginx-controller 8080:80
curl -H "Host: tasks.local" http://localhost:8080/health
```

## Troubleshooting rápido

- Pod en `CrashLoopBackOff` → `kubectl logs <pod> -n k8s-demo` y `kubectl describe pod <pod> -n k8s-demo` (mira la sección Events).
- Pod en `Pending` → normalmente el PVC no puede provisionarse; revisa `kubectl get pvc -n k8s-demo` y `kubectl describe pvc postgres-pvc -n k8s-demo`.
- `/ready` responde 503 → la app no logra conectarse a Postgres; revisa el Secret y el Service `postgres`.
- Ingress no responde → confirma que el ingress-nginx-controller esté `Running` y que el `ingressClassName: nginx` coincida.

## Próximos pasos (los vamos montando juntos)

1. **Monitoreo**: kube-prometheus-stack (Prometheus + Grafana) vía Helm, exponer métricas desde la app con `prom-client`.
2. **CI/CD**: pipeline en GitHub Actions que construya y publique la imagen a un registry (Azure Container Registry, ya que dominas Azure).
3. **GitOps**: ArgoCD apuntando a este mismo repo `k8s/`, para que los cambios se apliquen automáticamente al hacer push.
4. **Secretos productivos**: reemplazar el Secret plano por Sealed Secrets o External Secrets Operator + Azure Key Vault.
5. **Autoscaling**: HorizontalPodAutoscaler sobre `tasks-api` basado en CPU o métricas custom.
6. **HTTPS**: cert-manager + Let's Encrypt para TLS automático en el Ingress.

Dime cuándo termines el Paso 5 y seguimos con el siguiente bloque.
