# Zeppelin on Railway (your repo)

Wrapper repo so **you** host [ZeppelinBot/Zeppelin](https://github.com/ZeppelinBot/Zeppelin) on [Railway](https://railway.com) from a GitHub repository you control.

Zeppelin is not one process. Official production is:

| Process | Entrypoint command | Public URL? | Default port |
|---|---|---|---|
| migrate | `migrate` | no | — |
| api | `api` | yes | `PORT` or `3001` |
| dashboard | `dashboard` | yes | `PORT` or `3002` |
| bot | `bot` | no | — |

Plus **MySQL 8** and **Redis** (`REDIS_URL`, default `redis://redis:6379`).

This matches Zeppelin `docs/PRODUCTION.md` and `entrypoint.sh`.

---

## 1. Put this on GitHub

```bash
git init
git add .
git commit -m "Railway wrapper for Zeppelin"
git branch -M main
git remote add origin https://github.com/YOU/YOUR-REPO.git
git push -u origin main
```

Keep the repo private if it will ever contain notes about tokens. Secrets themselves go only in Railway Variables.

---

## 2. Discord application (before deploy)

1. https://discord.com/developers/applications → New Application
2. Bot → Reset Token → copy `BOT_TOKEN`
3. Enable **all 3 Privileged Gateway Intents**
4. OAuth2 → copy `CLIENT_ID` and `CLIENT_SECRET`
5. Leave Redirects empty until the API domain exists
6. Invite (do not expect commands to work yet):

```
https://discord.com/api/oauth2/authorize?client_id=CLIENT_ID&permissions=8&scope=bot%20applications.commands
```

Also copy your **user ID** (`STAFF`) and **server ID** (`DEFAULT_ALLOWED_SERVERS`).

Generate `KEY` (exactly 32 characters):

```bash
openssl rand -hex 16
```

---

## 3. Create the Railway project

1. [railway.com](https://railway.com) → New Project → Empty project
2. **+ New → Database → MySQL**
3. **+ New → Database → Redis**
4. Add **four** GitHub services from **this** repo (same repo, different start command):

| Railway service name | Start command | Public domain | Notes |
|---|---|---|---|
| `migrate` | `migrate` | no | Run once / after upgrades, then you can ignore it |
| `api` | `api` | yes | Generate domain |
| `dashboard` | `dashboard` | yes | Generate domain |
| `bot` | `bot` | **no** | Must stay running 24/7 |

For each of those four:

- Source = this GitHub repo
- Builder = Dockerfile
- Dockerfile path = `Dockerfile` (published `dragory/zeppelin` image)
- Custom start command = the table above  
  Railway keeps the image `ENTRYPOINT` and uses your start command as `CMD`, which is what `entrypoint.sh` expects (`migrate` / `api` / `bot` / `dashboard`).

Do **not** set start command to `pnpm run start-bot`. That string is not a valid entrypoint argument on current Zeppelin.

Optional JSON snapshots live in `railway/` if you want to copy settings by hand. Railway does not auto-apply those files to every service unless you point each service at them.

### Fork / build from source instead

On each Zeppelin service:

- Dockerfile path = `Dockerfile.source`
- Build args:
  - `GIT_REPO` = `https://github.com/ZeppelinBot/Zeppelin.git` or your fork
  - `GIT_REF` = `master` or a commit/tag

First source builds need more RAM/time than the prebuilt image.

---

## 4. Shared variables

Add these on **api**, **bot**, **dashboard**, and **migrate**.  
Use Railway **variable references** so you type secrets once.

```env
NODE_ENV=production
KEY=<32-char hex>
CLIENT_ID=<discord application id>
CLIENT_SECRET=<discord oauth secret>
BOT_TOKEN=<discord bot token>
STAFF=<your discord user id>
DEFAULT_ALLOWED_SERVERS=<your guild id>

DB_HOST=${{MySQL.MYSQLHOST}}
DB_PORT=${{MySQL.MYSQLPORT}}
DB_USER=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
DB_DATABASE=${{MySQL.MYSQLDATABASE}}

REDIS_URL=${{Redis.REDIS_URL}}
```

If your Redis plugin does not expose `REDIS_URL`, build it:

```env
REDIS_URL=redis://default:${{Redis.REDISPASSWORD}}@${{Redis.REDISHOST}}:${{Redis.REDISPORT}}
```

After domains exist, set on **api + bot + dashboard**:

```env
DASHBOARD_URL=https://${{dashboard.RAILWAY_PUBLIC_DOMAIN}}
API_URL=https://${{api.RAILWAY_PUBLIC_DOMAIN}}
API_PATH_PREFIX=
```

Replace `dashboard` / `api` with the exact Railway service names. No trailing slash.

Railway injects `PORT` for web services. Current Zeppelin API listens on `process.env.PORT || 3001` and the dashboard on `process.env.PORT || 3002`, both on `0.0.0.0`. You usually do not set `PORT` yourself.

`API_PATH_PREFIX` is empty in production by default. OAuth path is then:

```
https://<api-domain>/auth/oauth-callback
```

---

## 5. MySQL auth fix (do this when api/bot first crash on login)

Zeppelin’s MySQL client often fails against Railway MySQL 8 (`caching_sha2_password`).

1. MySQL service → copy `MYSQLPASSWORD`
2. Query tab:

```sql
ALTER USER 'root' IDENTIFIED WITH mysql_native_password BY 'PASTE_MYSQLPASSWORD';
FLUSH PRIVILEGES;
```

3. Redeploy **migrate**, then **api**, then **bot**

`scripts/mysql-native-password.sql` is the same snippet.

---

## 6. Order of first boot

1. MySQL + Redis healthy
2. Run **migrate** and wait until it exits 0
3. Deploy **api** and **dashboard**, generate public domains, set `API_URL` / `DASHBOARD_URL`, redeploy those two
4. Discord → OAuth2 Redirects → add:

```
https://<api-public-domain>/auth/oauth-callback
```

   No trailing slash. Save.
5. Deploy **bot** (no public domain)
6. Open the dashboard URL → login with Discord
7. In the allowed guild:

```
@Bot allow_server <other_guild_id>
```

`STAFF` users can run that. See Zeppelin `docs/MANAGEMENT.md`.

---

## 7. Service settings that matter

- **Bot**: never enable sleep / scale-to-zero
- **API + dashboard**: HTTP proxy / public networking on
- All Zeppelin services: restart on failure
- Region: put MySQL, Redis, api, bot, dashboard in the **same** region so private hostnames work
- Hobby plan is the realistic minimum; a bot that stays up burns the free hourly cap

---

## 8. Updating

**Image mode (`Dockerfile`)**  
Redeploy the four Zeppelin services so they pull `dragory/zeppelin:latest`. Run **migrate** after updates.

**Source mode (`Dockerfile.source`)**  
Bump nothing if `GIT_REF=master` — trigger a rebuild. For a pinned fork, push that fork and rebuild.

---

## 9. Common failures

| Symptom | Likely cause |
|---|---|
| `Unknown command` in logs | Start command is not exactly `api` / `bot` / `dashboard` / `migrate` |
| MySQL auth / `Plugin caching_sha2_password` | Run the ALTER USER fix |
| Bot starts then leaves the server | Guild id missing from `DEFAULT_ALLOWED_SERVERS` |
| Dashboard login bounce / 401 | Wrong OAuth redirect, or `API_URL` / `CLIENT_SECRET` mismatch |
| `redis` connection errors | `REDIS_URL` not set; default `redis://redis:6379` is Docker-compose only |
| Build OOM on `Dockerfile.source` | Use `Dockerfile` (prebuilt image) or a larger instance for the first build |
| KEY validation error | KEY must be **exactly** 32 characters |

---

## What this repo is / is not

- This is a **deploy wrapper**. Bot logic stays upstream: https://github.com/ZeppelinBot/Zeppelin
- Usage docs: https://zeppelin.gg/docs
- Self-host notes: https://zeppelin.wiki
- Official production notes already mention Railway: point a platform at the Dockerfile and run `api` / `bot` / `dashboard` as separate services, plus migrations.
