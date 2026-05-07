# Database Setup Guide

## Option 1: PostgreSQL with Docker (Recommended for Development)

### Prerequisites
- Docker Desktop installed and running

### Quick Start

```bash
# Start PostgreSQL container with port 5432
docker run --name eatgood-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=eatgood \
  -p 5432:5432 \
  -d postgres:16-alpine

# Or with custom port (e.g., 5433):
docker run --name eatgood-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=eatgood \
  -p 5433:5432 \
  -d postgres:16-alpine
```

### Common Docker Commands

```bash
# Check if container is running
docker ps | grep eatgood-db

# View logs
docker logs eatgood-db

# Stop the container
docker stop eatgood-db

# Start again
docker start eatgood-db

# Remove the container (when done)
docker rm eatgood-db
```

---

## Option 2: Local PostgreSQL Installation

### Windows
1. Download PostgreSQL installer from https://www.postgresql.org/download/windows/
2. Run the installer with these settings:
   - Port: 5432 (or your preferred port)
   - Username: postgres
   - Password: postgres (or your preferred password)
   - Default database: eatgood

3. Create the database:
```powershell
psql -U postgres -c "CREATE DATABASE eatgood;"
```

### macOS
```bash
# Using Homebrew
brew install postgresql@16
brew services start postgresql@16

# Create database
createdb -U postgres eatgood
```

### Linux (Ubuntu/Debian)
```bash
sudo apt-get install postgresql-16
sudo -u postgres psql -c "CREATE DATABASE eatgood;"
```

---

## Option 3: Neon Cloud Database

1. Go to https://neon.tech
2. Create a free account
3. Create a new project
4. Copy the connection string to .env as DATABASE_URL
5. No local setup needed

---

## Verify Connection

```bash
# Test with psql (if installed locally)
psql postgresql://postgres:postgres@localhost:5432/eatgood

# Or from the project:
psql $(cat .env | grep DATABASE_URL | cut -d= -f2)
```

---

## Update .env Based on Your Choice

If using Docker on different port:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/eatgood
DATABASE_URL_DIRECT=postgresql://postgres:postgres@localhost:5433/eatgood
```

If using cloud database:
```
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/eatgood?sslmode=require
DATABASE_URL_DIRECT=postgresql://user:pass@ep-xxx.neon.tech/eatgood?sslmode=require
```

---

## Next Steps

Once your database is running:

```bash
# Run migrations
pnpm migrate

# Start development server
pnpm dev
```

---
