# Deployment Guide

## Overview

Holo is designed for distributed deployment with multiple server processes communicating via RabbitMQ. This guide covers deployment strategies for different environments.

---

## Architecture Components

### Required Services

1. **API Server** (`src/app.ts`): HTTP interface for client requests
2. **Worker Server(s)** (`src/servers/worker.server.ts`): Process LLM requests
3. **Audit Server** (`src/servers/audit.server.ts`): Log requests/responses
4. **Analysis Server** (`src/servers/analysis.server.ts`): Analytics processing
5. **RabbitMQ**: Message broker for inter-process communication
6. **PostgreSQL**: Audit database

### Deployment Patterns

- **Development**: All services on single machine
- **Production**: Distributed across multiple machines/containers
- **Horizontal Scaling**: Multiple worker instances for load distribution

---

## Docker Deployment

### Docker Images

#### API Server Image

**Dockerfile:** `Dockerfile`

```bash
docker build -t holo-api:latest .
```

#### Audit Server Image

**Dockerfile:** `Dockerfile.audit`

```bash
docker build -t holo-audit:latest -f Dockerfile.audit .
```

---

### Docker Compose

**File:** `docker-compose.yml`

The provided `docker-compose.yml` defines the API server with external network dependencies.

**Start Services:**

```bash
docker-compose up -d
```

**Services:**
- **holo**: API server on port 3000
- **Networks**: Connects to external `holokai-network`
- **Volumes**: Mounts `audit_logs` for persistent logging

**External Dependencies** (must be running in `holokai-network`):
- RabbitMQ (holokai-mq)
- PostgreSQL (holokai-db)

---

### Environment Variables

Configure via `docker-compose.yml` or `.env` file:

```yaml
environment:
  - NODE_ENV=production
  - PORT=3000
  - RABBITMQ_URL=amqp://holokai-mq:5672
  - AUDIT_PG_HOST=holokai-db
  - AUDIT_PG_PORT=5432
  - AUDIT_PG_DATABASE=holokai
  - AUDIT_PG_USER=holo
  - AUDIT_PG_PASSWORD=holopassword
  - AUDIT_ENABLED=true
  - JWT_SECRET=your-super-secret-key-at-least-32-characters-long-and-random
  - API_SERVER_ID=production_api_01
  - CONFIG_MODE=QUEUE  # or FILE
```

---

## Manual Deployment

### Build Application

```bash
npm run build
```

Compiles TypeScript to `dist/` directory.

---

### Start Services

#### API Server

```bash
NODE_ENV=production \
PORT=3000 \
RABBITMQ_URL=amqp://rabbitmq-host:5672 \
node dist/app.js
```

---

#### Worker Server

```bash
NODE_ENV=production \
RABBITMQ_URL=amqp://rabbitmq-host:5672 \
node dist/servers/worker.server.js
```

**Scale Workers:** Run multiple instances with unique IDs:

```bash
WORKER_ID=worker_01 node dist/servers/worker.server.js &
WORKER_ID=worker_02 node dist/servers/worker.server.js &
WORKER_ID=worker_03 node dist/servers/worker.server.js &
```

---

#### Audit Server

```bash
NODE_ENV=production \
RABBITMQ_URL=amqp://rabbitmq-host:5672 \
AUDIT_PG_HOST=postgres-host \
AUDIT_PG_DATABASE=llm_audit \
node dist/servers/audit.server.js
```

---

#### Analysis Server

```bash
NODE_ENV=production \
RABBITMQ_URL=amqp://rabbitmq-host:5672 \
node dist/servers/analysis.server.js
```

---

## Kubernetes Deployment

### Example Deployment Structure

```
├── k8s/
│   ├── api-deployment.yaml
│   ├── worker-deployment.yaml
│   ├── audit-deployment.yaml
│   ├── rabbitmq-statefulset.yaml
│   ├── postgres-statefulset.yaml
│   ├── configmap.yaml
│   ├── secrets.yaml
│   └── service.yaml
```

### API Server Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: holo-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: holo-api
  template:
    metadata:
      labels:
        app: holo-api
    spec:
      containers:
      - name: holo-api
        image: holo-api:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "3000"
        - name: RABBITMQ_URL
          valueFrom:
            secretKeyRef:
              name: holo-secrets
              key: rabbitmq-url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: holo-secrets
              key: jwt-secret
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
```

### Worker Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: holo-worker
spec:
  replicas: 5  # Scale based on load
  selector:
    matchLabels:
      app: holo-worker
  template:
    metadata:
      labels:
        app: holo-worker
    spec:
      containers:
      - name: holo-worker
        image: holo-api:latest
        command: ["node", "dist/servers/worker.server.js"]
        env:
        - name: NODE_ENV
          value: "production"
        - name: RABBITMQ_URL
          valueFrom:
            secretKeyRef:
              name: holo-secrets
              key: rabbitmq-url
        resources:
          requests:
            memory: "1Gi"
            cpu: "1000m"
          limits:
            memory: "2Gi"
            cpu: "2000m"
```

### Service (Load Balancer)

```yaml
apiVersion: v1
kind: Service
metadata:
  name: holo-api
spec:
  type: LoadBalancer
  ports:
  - port: 80
    targetPort: 3000
    protocol: TCP
  selector:
    app: holo-api
```

---

## Configuration Management

### File-Based Configuration (Development)

1. Create configuration JSON file
2. Mount file into container
3. Set `CONFIG_MODE=FILE`
4. Specify file path in environment

**Docker Volume Example:**

```yaml
volumes:
  - ./config/organization.json:/app/config/organization.json
environment:
  - CONFIG_MODE=FILE
  - CONFIG_FILE_PATH=/app/config/organization.json
```

---

### Queue-Based Configuration (Production)

1. Deploy configuration service (publishes to RabbitMQ)
2. Set `CONFIG_MODE=QUEUE`
3. All instances listen on config queue
4. Configuration updates broadcast to all servers

**Benefits:**
- Dynamic configuration updates without restart
- Centralized configuration management
- Multi-server synchronization

---

## Security

### JWT Secret

**Generate Secure Secret:**

```bash
openssl rand -base64 32
```

Set in environment:

```bash
JWT_SECRET=<generated-secret>
```

**Important:** Never commit secrets to version control.

---

### Provider API Keys

Store provider API keys in:
- Kubernetes Secrets
- AWS Secrets Manager
- HashiCorp Vault
- Environment variables (encrypted)

**Configuration Example:**

```json
{
  "providers": [
    {
      "type": "openai",
      "config": {
        "apiKey": "${OPENAI_API_KEY}"
      }
    }
  ]
}
```

---

### Database Credentials

Use secure credential management:
- Kubernetes Secrets
- Cloud provider secret services
- Encrypted environment variables

---

## Monitoring

### Health Checks

**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-20T00:00:00.000Z",
  "uptime": 3600,
  "version": "1.0.0"
}
```

**Use for:**
- Kubernetes liveness/readiness probes
- Load balancer health checks
- Monitoring systems

---

### Logging

**Winston Logger** outputs to:
- Console (stdout/stderr)
- File (`logs/` directory)

**Log Levels:**
- `error`: Critical errors
- `warn`: Warnings
- `info`: Normal operations
- `debug`: Detailed debugging

**Production Recommendation:** Aggregate logs using:
- ELK Stack (Elasticsearch, Logstash, Kibana)
- Splunk
- Datadog
- CloudWatch Logs

---

### Metrics

**Key Metrics to Monitor:**
- Request latency
- Queue depth (RabbitMQ)
- Worker utilization
- Error rates
- Provider API response times
- Token usage and costs

**Tools:**
- Prometheus + Grafana
- Datadog
- New Relic
- CloudWatch

---

## Scaling

### Horizontal Scaling

#### API Servers
- Run multiple instances behind load balancer
- Stateless design allows easy scaling
- Session state managed via JWT (no server-side sessions)

#### Workers
- Scale workers based on queue depth
- Add more workers during high load
- Kubernetes HPA (Horizontal Pod Autoscaler)

**Example HPA:**

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: holo-worker-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: holo-worker
  minReplicas: 2
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

---

### Vertical Scaling

Adjust resource limits based on:
- Worker memory usage (LLM responses can be large)
- API server concurrency
- Audit server database write throughput

---

## High Availability

### Multi-Region Deployment

1. Deploy in multiple regions/availability zones
2. Use geo-distributed RabbitMQ cluster
3. PostgreSQL replication for audit database
4. Global load balancer (AWS Route 53, Cloudflare)

---

### Disaster Recovery

**Backup:**
- PostgreSQL audit database (daily backups)
- Configuration files/queue snapshots
- Provider credentials (secure storage)

**Recovery Plan:**
1. Restore database from backup
2. Redeploy services
3. Restore configuration
4. Verify health checks

---

## CI/CD Pipeline

### Example GitHub Actions

```yaml
name: Deploy Holo

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Build Docker Image
        run: docker build -t holo:${{ github.sha }} .

      - name: Push to Registry
        run: docker push holo:${{ github.sha }}

      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/holo-api \
            holo-api=holo:${{ github.sha }}
          kubectl set image deployment/holo-worker \
            holo-worker=holo:${{ github.sha }}
```

---

## Environment-Specific Configuration

### Development
- File-based configuration
- Single-server deployment
- Local RabbitMQ and PostgreSQL
- Mock providers for testing

### Staging
- Queue-based configuration
- 2-3 worker instances
- Cloud-hosted RabbitMQ (CloudAMQP) and PostgreSQL (RDS)
- Real provider integrations (separate API keys)

### Production
- Queue-based configuration
- Auto-scaling worker pools (5-20+ instances)
- Managed RabbitMQ cluster (CloudAMQP, Amazon MQ)
- Managed PostgreSQL (RDS, Aurora)
- Multi-region deployment
- Full monitoring and alerting

---

## Troubleshooting

### Service Won't Start

**Check:**
1. Environment variables set correctly
2. RabbitMQ accessible
3. PostgreSQL accessible (for audit server)
4. Port not already in use

**Logs:**
```bash
docker logs <container-id>
```

---

### High Queue Depth

**Cause:** Workers can't keep up with request volume

**Solutions:**
1. Scale up worker instances
2. Check provider API latency
3. Verify workers are healthy
4. Review worker resource limits

---

### Database Connection Pool Exhausted

**Cause:** Too many concurrent database connections

**Solutions:**
1. Increase pool size in `AppDB` config
2. Scale database instance
3. Review slow queries
4. Add connection pooling proxy (PgBouncer)

---

## Production Checklist

- [ ] Build and test Docker images
- [ ] Set secure JWT_SECRET
- [ ] Configure provider API keys (encrypted)
- [ ] Set up PostgreSQL audit database
- [ ] Deploy RabbitMQ cluster
- [ ] Configure health checks
- [ ] Set up logging aggregation
- [ ] Configure monitoring and alerting
- [ ] Test failover scenarios
- [ ] Document rollback procedure
- [ ] Set up CI/CD pipeline
- [ ] Configure auto-scaling policies
- [ ] Enable audit logging
- [ ] Test with production-like load
- [ ] Perform security audit
- [ ] Set up backup and disaster recovery

---

## Support

For deployment issues, check:
- [Development Guide](./development-guide.md)
- [Architecture Documentation](../ARCHITECTURE.md)
- [README](../README.md)
