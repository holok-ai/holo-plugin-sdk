# LLM Audit Service

This service captures all LLM requests and logs them to a PostgreSQL database for auditing purposes.

## How It Works

1. The audit service listens to the `llm_requests_audit` queue which receives copies of all requests sent to the main LLM processing queue
2. For each request, it extracts the relevant information and stores it in a PostgreSQL database
3. The service runs independently from the main LLM proxy service, allowing for separate scaling and operations

## Database Schema

The audit service creates a table called `llm_request_audit` with the following structure:

| Column       | Type        | Description                          |
|--------------|-------------|--------------------------------------|
| id           | SERIAL      | Primary key                          |
| request_id   | VARCHAR(36) | Unique ID for the request            |
| request_type | VARCHAR(50) | Type of request (generate, chat)     |
| model        | VARCHAR(100)| Model name requested                 |
| prompt       | TEXT        | The prompt or last message in chat   |
| options      | JSONB       | Request options as JSON              |
| source_id    | VARCHAR(100)| Server ID that received the request  |
| user_id      | VARCHAR(100)| User ID if provided                  |
| timestamp    | TIMESTAMP   | When the request was made            |
| metadata     | JSONB       | Additional metadata including full request |

## Running the Service

### Environment Variables

| Variable           | Description                           | Default               |
|--------------------|---------------------------------------|------------------------|
| AUDIT_ENABLED      | Enable/disable the audit service      | false                 |
| AUDIT_PG_HOST      | PostgreSQL host                       | localhost             |
| AUDIT_PG_PORT      | PostgreSQL port                       | 5432                  |
| AUDIT_PG_DATABASE  | PostgreSQL database name              | llm_audit             |
| AUDIT_PG_USER      | PostgreSQL username                   | postgres              |
| AUDIT_PG_PASSWORD  | PostgreSQL password                   | postgres              |
| RABBITMQ_URL       | RabbitMQ connection URL               | amqp://localhost      |

### Running Standalone

To run the audit service separately from the main application:

```bash
# From the project root
cd src/audit
npm install
npm start
```

### Running with Docker

The audit service is included in the Docker Compose configuration:

```bash
# From the project root
docker-compose up -d audit-service
```

## Querying Audit Data

You can query the audit data directly from PostgreSQL using SQL. Here are some example queries:

### Get all requests for a specific model

```sql
SELECT * FROM llm_request_audit 
WHERE model = 'llama2-70b' 
ORDER BY timestamp DESC;
```

### Get requests from a specific user

```sql
SELECT * FROM llm_request_audit 
WHERE user_id = 'user123' 
ORDER BY timestamp DESC;
```

### Get daily request counts

```sql
SELECT 
  DATE(timestamp) as day, 
  COUNT(*) as request_count 
FROM llm_request_audit 
GROUP BY DATE(timestamp) 
ORDER BY day DESC;
```

### Get average prompt length by model

```sql
SELECT 
  model, 
  AVG(LENGTH(prompt)) as avg_prompt_length 
FROM llm_request_audit 
GROUP BY model 
ORDER BY avg_prompt_length DESC;
```

## Using pgAdmin

The Docker Compose setup includes pgAdmin for easier database management:

1. Access pgAdmin at `http://localhost:5050`
2. Login with the credentials:
   - Email: `admin@example.com`
   - Password: `adminpassword`
3. Add a new server connection:
   - Host: `postgres`
   - Port: `5432`
   - Database: `llm_audit`
   - Username: `postgres`
   - Password: `postgrespassword`
