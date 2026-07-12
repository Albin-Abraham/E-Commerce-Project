# SaaS Platform Overview

## Architecture Pattern
*   **Container-Oriented Modular Monolith**
*   **Distributed Task Execution** (Celery-ready)
*   **Queue Isolation**
*   **Kubernetes-Compatible Design**

## Components
| Layer | Technology |
| :--- | :--- |
| **Web** | Django + Gunicorn |
| **Async** | Celery |
| **Broker** | Redis |
| **Primary DB** | PostgreSQL |
| **Legacy DB** | MySQL |
| **Admin Panel** | Django Admin + Adminer |
| **Scheduler** | Celery Beat |
| **Monitoring** | Flower |

## Deployment Philosophy
*   **Stateless web**: Horizontally scalable.
*   **Externalized configuration**: Environment-driven runtime.
*   **Explicit health checks**: Defined in K8s probes.
*   **Migration as controlled job**: Decoupled from application startup.
*   **Immutable image builds**: SHA-tagged images.

## Getting Started
### Prerequisites
*   Docker & Docker Compose
*   Make

### Local Development
1. Clone the repository.
2. Copy environmental variables: `cp .env.example .env.dev`
3. Start the platform: `make up`
4. Run migrations: `make migrate`


- optional for docker proxy 
# Stop and remove all old containers
docker rm -f backend-celery_default-1 backend-celery_beat-1 backend-migrate-1

# (Optional) Remove old networks and volumes if you want a complete clean slate
docker network prune
docker volume prune