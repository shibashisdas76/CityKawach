# ─────────────────────────────────────────────────────────────────────────────
# Dockerfile for Sentinel Gujarat (Unified Production Container Deployment)
# Multi-stage Docker build: React 18 SPA + Python FastAPI + AI/ML Engine
# ─────────────────────────────────────────────────────────────────────────────

# Stage 1: Build Frontend SPA
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
COPY apps/registry-web/package*.json ./apps/registry-web/
RUN cd apps/registry-web && npm install
COPY apps/registry-web ./apps/registry-web
COPY shared ./shared
RUN cd apps/registry-web && npm run build

# Stage 2: Production Python Backend Container
FROM python:3.10-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    git \
    ffmpeg \
    libsm6 \
    libxext6 \
    && rm -rf /var/lib/apt/lists/*

# Install CPU PyTorch and Python packages
COPY services/analytics-service/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu \
    && pip install --no-cache-dir -r requirements.txt

# Copy backend source code & shared types
COPY services/analytics-service /app/services/analytics-service
COPY shared /app/shared

# Copy frontend static build into python service
COPY --from=frontend-builder /app/apps/registry-web/dist /app/services/analytics-service/dist
COPY --from=frontend-builder /app/apps/registry-web/dist /app/apps/registry-web/dist

ENV PORT=10000
EXPOSE 10000

CMD ["sh", "-c", "python -m uvicorn services.analytics-service.main:app --host 0.0.0.0 --port $PORT"]
