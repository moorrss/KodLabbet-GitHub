# KodLabbet

> En interaktiv kodutbildningsplattform byggd med **ASP.NET Core 9**, **C#** och **Vanilla JavaScript**.

![ASP.NET Core](https://img.shields.io/badge/ASP.NET_Core-9.0-512BD4?logo=dotnet)
![C#](https://img.shields.io/badge/C%23-13.0-239120?logo=csharp)
![JavaScript](https://img.shields.io/badge/JavaScript-ES2024-F7DF1E?logo=javascript)
![SQLite](https://img.shields.io/badge/SQLite-EF_Core-003B57?logo=sqlite)
![License](https://img.shields.io/badge/license-MIT-green)

---

## Om projektet

KodLabbet är en fullstack-webbapplikation för att lära sig programmering via projekt, AI-guidning och dagliga kodutmaningar. Projektet är byggt som ett personligt sidoprojekt för att demonstrera fullstack-kompetens i .NET-ekosystemet.

**Live demo:** [www.Kodlabbet.com](https://www.Kodlabbet.com) *(kommer snart)*

---

## Funktioner

- **25 kodprojekt** i JavaScript, Python och C# — tre svårighetsnivåer
- **Inbyggd kodeditor** med live-körning direkt i webbläsaren
- **JWT-autentisering** med access + refresh token rotation
- **Dagliga kodutmaningar** med streak-system och XP
- **PvP-arenor** — tävla mot andra i realtid
- **Kunskapsbankens** 22 artiklar om moderna teknologier
- **Recensionssystem** med filtrering och betygsättning
- **Mörkt/ljust tema** med localStorage-persistens
- **Fullständigt responsiv** — fungerar på alla skärmstorlekar
- **Rate limiting** och **CSP-headers** för säkerhet

---

## Teknisk stack

| Lager | Teknologi |
|-------|-----------|
| **Backend** | ASP.NET Core 9, C# 13 |
| **Databas** | SQLite via Entity Framework Core 9 |
| **Autentisering** | JWT Bearer + Refresh Tokens (rotation) |
| **Lösenord** | BCrypt (work factor 11) |
| **Rate Limiting** | ASP.NET Core inbyggd (Fixed Window) |
| **Frontend** | Vanilla JavaScript (ES2024), HTML5, CSS3 |
| **Hosting** | Statiska filer serveras direkt av Kestrel |

---

## Projektstruktur

```
KodLabbet/
├── Controllers/
│   └── Controllers.cs      ← Auth, Users, Projects, Comments, Reviews
├── Data/
│   ├── AppDbContext.cs      ← EF Core + SQLite-konfiguration
│   └── DbSeeder.cs         ← Grunddata och demo-konton
├── Models/
│   └── Models.cs           ← Entiteter + DTO:er (Records)
├── Services/
│   ├── AuthService.cs      ← Register, Login, Refresh, Logout
│   ├── TokenService.cs     ← JWT + Refresh token-generering
│   └── Services.cs         ← User, Project, Comment, Review
├── wwwroot/
│   ├── index.html          ← SPA-frontend (Single Page App)
│   ├── css/site.css        ← ~3 000 rader CSS (design system)
│   └── js/app.js           ← ~3 800 rader JS (all applogik)
├── Program.cs              ← Middleware, DI, konfiguration
├── appsettings.json        ← Konfiguration (utan hemligheter)
└── KodLabbet.csproj        ← NuGet-beroenden
```

---

##  API-endpoints

### Autentisering
```
POST /api/auth/register    { username, email, password }
POST /api/auth/login       { email, password }
POST /api/auth/refresh     { refreshToken }
POST /api/auth/logout      { refreshToken }          
```

### Användare
```
GET  /api/users/me                                   
PUT  /api/users/me         { username?, avatar?, bio? } 
```

### Projekt
```
GET  /api/projects
POST /api/projects/{id}/start                        JWT
POST /api/projects/{id}/complete                     JWT  (+50 XP)
GET  /api/projects/completed                         JWT
POST /api/projects/daily/complete                    JWT
```

### Kommentarer & Recensioner
```
GET  /api/projects/{id}/comments
POST /api/projects/{id}/comments                     JWT  (+2 XP)
POST /api/reviews                                    JWT  (+10 XP)
GET  /api/reviews
```

*JWT = Kräver giltig JWT*

---

##  Säkerhetsimplementationer

```csharp
// JWT med kort livslängd + refresh token rotation
var token = new JwtSecurityToken(
    claims:   claims,
    expires:  DateTime.UtcNow.AddMinutes(15),   // Kort access token
    signingCredentials: creds);

// BCrypt med hög work factor
PasswordHash = BCrypt.Net.BCrypt.HashPassword(password);  // work factor 11

// Rate limiting: 10 req/min på auth-endpoints
opts.AddFixedWindowLimiter("auth", o => {
    o.PermitLimit = 10;
    o.Window      = TimeSpan.FromMinutes(1);
});
```

- All användarinput saniteras via `esc()` i frontend (XSS-skydd)
- Content-Security-Policy i HTML-header
- CORS konfigurerat med whitelist
- Refresh tokens revokeras vid logout

---

## Kom igång lokalt

### Krav
- [.NET 9 SDK](https://dotnet.microsoft.com/download/dotnet/9.0)
- VS Code med **C# Dev Kit**-tillägget

### Installation

```bash
# 1. Klona repot
git clone https://github.com/DITT_ANVÄNDARNAMN/kodlabbet.git
cd kodlabbet

# 2. Kopiera och fyll i dina egna hemligheter
cp appsettings.Development.json.example appsettings.Development.json
# Redigera appsettings.Development.json och sätt ett eget JWT-secret

# 3. Installera NuGet-paket
dotnet restore

# 4. Starta (databasen skapas automatiskt)
dotnet run
```

Appen startar på **http://localhost:5000**

---

## Konfiguration

Kopiera `appsettings.Development.json.example` till `appsettings.Development.json` och fyll i:

```json
{
  "Jwt": {
    "Secret": "DITT_STARKA_HEMLIGA_JWT_SECRET_MINST_32_TECKEN"
  }
}
```

>  Lägg **aldrig** in riktiga hemligheter i `appsettings.json` som committas till Git.

---

##  NuGet-paket

| Paket | Syfte |
|-------|-------|
| `Microsoft.EntityFrameworkCore.Sqlite` | ORM + SQLite |
| `Microsoft.AspNetCore.Authentication.JwtBearer` | JWT-middleware |
| `System.IdentityModel.Tokens.Jwt` | Token-generering |
| `BCrypt.Net-Next` | Lösenordshashing |

---

## Licens

MIT — fritt att använda, modifiera och distribuera.

---

*Byggt av [MorsAB](https://github.com/DITT_ANVÄNDARNAMN) · Malmö, Sverige · 2026*
