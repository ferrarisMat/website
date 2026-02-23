# Website CMS — Craft CMS 5 + GraphQL

Headless Craft CMS backend for country/DnB scene data.
The React frontend consumes it via GraphQL at `/api`.

---

## Content Model

```
Country (Section: countries, Channel)
├── title              — Country name
├── countryDescription — Plain Text (multiline)
├── latitude           — Number (decimal, −90 to 90)
├── longitude          — Number (decimal, −180 to 180)
├── distance           — Number (integer)
└── subGenres          — Matrix
    └── Sub Genre (entry type: subGenre)
        ├── subGenreName — Plain Text
        └── artists      — Matrix
            └── Artist (entry type: artist)
                ├── artistName — Plain Text
                ├── artistBio  — Plain Text (multiline)
                └── links      — Table
                    ├── col1: Name
                    └── col2: URL
```

---

## Prerequisites

- **Docker Desktop** — [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/)

That's it. PHP, Composer, and MySQL all run inside Docker.

---

## Fresh Setup (step by step)

### 1. Clone & enter the cms directory

```bash
cd cms
```

### 2. Create your environment file

```bash
cp .env.example .env
```

Edit `.env` if you want to change the DB credentials or site URL.
Leave `CRAFT_SECURITY_KEY` blank for now — the next step fills it in.

### 3. Build & start the Docker stack

```bash
docker compose up -d --build
```

This starts:
- **php** — Apache 2.4 + PHP 8.2 on `http://localhost:8080`
- **mysql** — MySQL 8 (data persisted in a named Docker volume)

Wait for MySQL to be healthy before continuing (usually ~10 seconds).
You can check with:

```bash
docker compose ps
```

### 4. Install Composer dependencies

```bash
docker compose exec php composer install
```

This populates `vendor/` on your host machine via the volume mount.

### 5. Generate a security key

```bash
docker compose exec php php craft setup/security-key
```

This writes `CRAFT_SECURITY_KEY=...` into your `.env` file automatically.

> If prompted "Craft commands should not be run as root — proceed anyway?", type `yes`.

### 6. Install Craft

```bash
docker compose exec php php craft install
```

Interactive prompts:
| Prompt | Value |
|---|---|
| Site name | anything (e.g. `DnB Around the World`) |
| Site URL | `http://localhost:8080` |
| Language | `en` |
| Username | your choice |
| Password | your choice |
| Email | your choice |

> Note: during install, Craft validates `config/project/`. If you see a schema version error, move `config/project/project.yaml` aside, run install, then restore it (see Troubleshooting below).

### 7. Apply the content model

```bash
docker compose exec php php craft project-config/apply
```

This reads the split YAML files in `config/project/` and creates:
- **Countries** channel section
- All fields (description, lat/lon, distance, Sub Genres Matrix → Artists Matrix → Links Table)
- **Public** GraphQL schema (no token required)

### 8. Open the Control Panel

```
http://localhost:8080/admin
```

Log in and start adding countries under **Entries → Countries**.

---

## GraphQL

### Endpoint

```
POST http://localhost:8080/api
Content-Type: application/json
```

No authentication token needed — the Public schema is read-only.

### Sample query

Also saved in [`graphql/GetCountries.graphql`](graphql/GetCountries.graphql).

```graphql
query GetCountries {
  entries(section: "countries") {
    id
    title
    ... on countries_country_Entry {
      countryDescription
      latitude
      longitude
      distance
      subGenres {
        ... on subGenres_subGenre_Entry {
          subGenreName
          artists {
            ... on artists_artist_Entry {
              artistName
              artistBio
              links { col1 col2 }
            }
          }
        }
      }
    }
  }
}
```

### Quick test with curl

```bash
curl -X POST http://localhost:8080/api \
  -H "Content-Type: application/json" \
  -d '{"query":"{ entries(section: \"countries\") { title } }"}'
```

### Inline fragment type names

Craft generates GraphQL type names from section/field handles:

| Data | GraphQL type |
|---|---|
| Country entry | `countries_country_Entry` |
| Sub Genre Matrix block | `subGenres_subGenre_Entry` |
| Artist Matrix block | `artists_artist_Entry` |

---

## Day-to-day commands

```bash
# Start the stack
docker compose up -d

# Stop the stack
docker compose down

# View logs
docker compose logs -f php

# Run any Craft CLI command
docker compose exec php php craft <command>

# Rebuild the image after Dockerfile changes
docker compose up -d --build
```

---

## Troubleshooting

### "Invalid command 'Header'" → 500 on /admin
`mod_headers` isn't enabled. Make sure the Dockerfile has:
```dockerfile
RUN a2enmod rewrite headers
```
Then rebuild: `docker compose up -d --build`.

### "Project config validation failed: expects ."
Craft found `config/project/` before the DB was set up. Fix:
```bash
# Temporarily move project config aside
mv config/project/project.yaml config/project/project.yaml.bak

# Install Craft (generates a fresh project.yaml)
docker compose exec php php craft install

# Restore our content model
mv config/project/project.yaml.bak config/project/project.yaml

# Apply
docker compose exec php php craft project-config/apply
```

### "Could not open input file: craft"
The `vendor/` directory is empty. Run `docker compose exec php composer install` first.

### "Class Dotenv\Dotenv not found"
Stale vendor directory from a failed install. Clean and reinstall:
```bash
docker compose exec php rm -rf vendor composer.lock
docker compose exec php composer install
```

---

## Production Deployment

1. Point a PHP 8.2 + Apache host at `cms/web/` as the document root.
2. Enable `mod_rewrite` and `mod_headers` on the server.
3. Copy `.env.example` → `.env` and fill in all values (real DB, real URL, real security key).
4. Run `composer install --no-dev --optimize-autoloader`.
5. Run `php craft project-config/apply`.
6. GraphQL endpoint: `https://your-domain.com/api`.
