@echo off
SET ROOT=%cd%\backend

REM -------------------------
REM CREATE MAIN SRC FOLDERS
REM -------------------------
mkdir "%ROOT%\src\config"
mkdir "%ROOT%\src\controllers"
mkdir "%ROOT%\src\services"
mkdir "%ROOT%\src\repositories"
mkdir "%ROOT%\src\middlewares"
mkdir "%ROOT%\src\routes"
mkdir "%ROOT%\src\utils"
mkdir "%ROOT%\src\types"
mkdir "%ROOT%\src\jobs"

REM -------------------------
REM CREATE PRISMA FOLDERS
REM -------------------------
mkdir "%ROOT%\prisma\models"
mkdir "%ROOT%\prisma\migrations"

REM -------------------------
REM CREATE CONFIG FILES
REM -------------------------
> "%ROOT%\src\config\db.ts" echo // db.ts
> "%ROOT%\src\config\env.ts" echo // env.ts
> "%ROOT%\src\config\mail.ts" echo // mail.ts
> "%ROOT%\src\config\logger.ts" echo // logger.ts

REM -------------------------
REM CREATE CONTROLLERS
REM -------------------------
set CONTROLLERS=auth user tenant email template campaign contact session audit
for %%a in (%CONTROLLERS%) do (
    > "%ROOT%\src\controllers\%%a.controller.ts" echo // %%a controller
)

REM -------------------------
REM CREATE SERVICES
REM -------------------------
set SERVICES=auth user tenant email template campaign contact session audit
for %%a in (%SERVICES%) do (
    > "%ROOT%\src\services\%%a.service.ts" echo // %%a service
)

REM -------------------------
REM CREATE REPOSITORIES
REM -------------------------
set REPOS=user tenant email template campaign contact session audit
for %%a in (%REPOS%) do (
    > "%ROOT%\src\repositories\%%a.repository.ts" echo // %%a repository
)

REM -------------------------
REM CREATE MIDDLEWARES
REM -------------------------
set MIDDLEWARES=auth role tenant error rateLimit
for %%a in (%MIDDLEWARES%) do (
    > "%ROOT%\src\middlewares\%%a.middleware.ts" echo // %%a middleware
)

REM -------------------------
REM CREATE ROUTES
REM -------------------------
set ROUTES=auth user tenant email template campaign contact session audit
for %%a in (%ROUTES%) do (
    > "%ROOT%\src\routes\%%a.routes.ts" echo // %%a routes
)

REM -------------------------
REM CREATE UTILS
REM -------------------------
set UTILS=crypto validator date mailParser
for %%a in (%UTILS%) do (
    > "%ROOT%\src\utils\%%a.ts" echo // %%a util
)

REM -------------------------
REM CREATE TYPES
REM -------------------------
set TYPES=user tenant email template campaign contact session
for %%a in (%TYPES%) do (
    > "%ROOT%\src\types\%%a.types.ts" echo // %%a types
)

REM -------------------------
REM CREATE JOBS
REM -------------------------
set JOBS=campaignScheduler emailSender cleanupJobs
for %%a in (%JOBS%) do (
    > "%ROOT%\src\jobs\%%a.ts" echo // %%a job
)

REM -------------------------
REM CREATE MAIN APP & SERVER
REM -------------------------
> "%ROOT%\src\app.ts" echo // Express app setup
> "%ROOT%\src\server.ts" echo // Server entry point

REM -------------------------
REM CREATE PRISMA MODEL FILES
REM -------------------------
set MODELS=user tenant email template campaign contact session audit
for %%a in (%MODELS%) do (
    > "%ROOT%\prisma\models\%%a.model.prisma" echo // %%a model prisma
)

REM -------------------------
REM CREATE MAIN PRISMA SCHEMA
REM -------------------------
> "%ROOT%\prisma\schema.prisma" echo // Prisma schema

REM -------------------------
REM CREATE PACKAGE, TS, ENV, README
REM -------------------------
> "%ROOT%\package.json" echo {}
> "%ROOT%\tsconfig.json" echo // TypeScript config
> "%ROOT%\.env" echo # Environment variables
> "%ROOT%\README.md" echo # README

echo ------------------------
echo Backend folder structure created successfully!
pause
