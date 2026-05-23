# Database Setup & Migrations

This folder contains the PostgreSQL database schemas and migrations for the Multi-Service Marketplace Platform.

## 📂 Folder Structure

- `migrations/001_init_schema.sql`: Full raw PostgreSQL schema DDL (Tables, Indexes, Foreign Keys, Triggers, and Category Seed Data).
- `schema.prisma`: Prisma ORM schema corresponding exactly to the database design.

---

## 🚀 How to Run the Migrations

### Option A: Using Raw PostgreSQL CLI (Recommended for raw SQL)

If you have a PostgreSQL server running locally or hosted on AWS RDS/Supabase, you can execute the migration script using `psql`:

```bash
# Set your environment variables (or type them inline)
export PGHOST="your-postgres-host"
export PGPORT=5432
export PGUSER="your-database-user"
export PGPASSWORD="your-database-password"
export PGDATABASE="your-database-name"

# Execute the migration script
psql -f migrations/001_init_schema.sql
```

Alternatively, you can run it via a single command line:
```bash
psql -h localhost -U postgres -d your_db_name -f migrations/001_init_schema.sql
```

---

### Option B: Using Prisma ORM in Next.js

If you decide to use Prisma in your Next.js project:

1. **Install Prisma CLI and Client** (if not already installed in your Next.js project):
   ```bash
   npm install prisma @prisma/client
   ```

2. **Configure Database Connection**:
   Create a `.env` file in the root of your Next.js project:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/your_db_name?schema=public"
   ```

3. **Initialize Prisma Migration**:
   Move `schema.prisma` to the standard prisma folder:
   ```bash
   mkdir prisma
   mv db/schema.prisma prisma/schema.prisma
   ```

4. **Run the migration or database push**:
   ```bash
   npx prisma db push
   ```
   Or run a standard migration:
   ```bash
   npx prisma migrate dev --name init
   ```

---

## 📊 Database Objects Created

### Core Tables
1. **`users`**: Authentication credentials, creation timestamps, and roles (`client`, `provider`, `admin`).
2. **`client_profiles`**: Personal details, phone numbers, and avatars for Clients.
3. **`provider_profiles`**: Bio, skills list, portfolio links, rating aggregations, and availability toggle for Providers.
4. **`categories`**: Hierarchy of services supporting subcategories (e.g., `Software Development` under `Digital Services`).
5. **`jobs`**: Service posts with custom requirements, budget, deadlines, locations, and state tracker.
6. **`job_attachments`**: Links to S3-stored files for job specs.
7. **`proposals`**: Bid amounts, times, and pitches submitted by providers.
8. **`contracts`**: Active contracts binding client and provider.
9. **`milestones`**: Supports partial releases and Escrow status updates.
10. **`deliveries`**: Submissions containing S3-stored files and descriptions.
11. **`revisions`**: Log details for revision iterations.
12. **`transactions`**: Full double-entry financial logs (escrow deposit, release, refund, fee).
13. **`disputes`**: Moderation table for conflict resolution.
14. **`reviews`**: Multi-dimensional reviews (quality, communication, timeliness, and average rating).
15. **`chat_rooms`, `chat_members`, `messages`**: Real-time communication structures.
16. **`notifications`**: User alerts for all events (job, bid, contract status, or payments).

### Performance Optimization (Indices)
All high-volume query routes are indexed to ensure queries remain fast as the user base grows:
- Unique indices on keys (`email`, unique profile pairings).
- ForeignKey indexing to optimize query joins.
- State-based indexing on active states (e.g., jobs `status`, notifications `is_read`).
