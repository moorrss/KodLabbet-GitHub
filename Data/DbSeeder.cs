using KodLabbet.Models;
using Microsoft.EntityFrameworkCore;

namespace KodLabbet.Data;

/// <summary>
/// Fyller databasen med grunddata vid första körning.
/// Körs automatiskt från Program.cs.
/// </summary>
public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
        // Seed projekt om tabellen är tom
        if (!await db.Projects.AnyAsync())
        {
            db.Projects.AddRange(GetProjects());
            await db.SaveChangesAsync();
        }

        // Seed demo-användare om ingen finns
        if (!await db.Users.AnyAsync())
        {
            db.Users.AddRange(
                new User
                {
                    Username     = "admin",
                    Email        = "admin@example.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(Environment.GetEnvironmentVariable("SEED_ADMIN_PW") ?? "ChangeMe123!"),
                    IsPro        = true,
                    Avatar       = "👑",
                    Bio          = "KodLabbet admin",
                    Xp           = 9999,
                    Streak       = 30,
                    BestStreak   = 30
                },
                new User
                {
                    Username     = "demo",
                    Email        = "demo@example.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(Environment.GetEnvironmentVariable("SEED_DEMO_PW") ?? "ChangeMe123!"),
                    IsPro        = false,
                    Avatar       = "🧑‍💻",
                    Bio          = "Demo-konto — testa gärna!",
                    Xp           = 250,
                    Streak       = 3,
                    BestStreak   = 7
                }
            );
            await db.SaveChangesAsync();
        }
    }

    private static List<Project> GetProjects() =>
    [
        new() { ExternalId="1",  Title="Gissningsleken",              Level="beginner", IsFree=true,  Tags="javascript",        Category="loopar",   TimeEstimate="1–2h", Description="Gissa det hemliga talet. Loopar och villkor." },
        new() { ExternalId="2",  Title="Miniräknare",                 Level="beginner", IsFree=true,  Tags="javascript",        Category="dom",      TimeEstimate="1–2h", Description="Bygg en fungerande räknare med knappar." },
        new() { ExternalId="3",  Title="Väderapp med API",            Level="medium",   IsFree=true,  Tags="javascript",        Category="api",      TimeEstimate="3–4h", Description="Hämta riktigt väder med fetch() och OpenWeather." },
        new() { ExternalId="4",  Title="Todo-lista",                  Level="beginner", IsFree=false, Tags="javascript",        Category="dom",      TimeEstimate="2–3h", Description="Klassisk todo-app med localStorage." },
        new() { ExternalId="5",  Title="Portoföljsida",               Level="beginner", IsFree=true,  Tags="javascript,css",    Category="html",     TimeEstimate="2–4h", Description="Din egna professionella portföljsida." },
        new() { ExternalId="6",  Title="REST API med Node.js",        Level="medium",   IsFree=false, Tags="javascript",        Category="api",      TimeEstimate="4–6h", Description="Bygg ett REST API med Express och JSON." },
        new() { ExternalId="7",  Title="C# Konsol-RPG",               Level="medium",   IsFree=false, Tags="csharp",            Category="loopar",   TimeEstimate="4–6h", Description="Textbaserat RPG-spel i C#." },
        new() { ExternalId="8",  Title="Python Dataanalys",           Level="medium",   IsFree=false, Tags="python",            Category="data",     TimeEstimate="3–5h", Description="Analysera CSV-data med pandas och matplotlib." },
        new() { ExternalId="9",  Title="Chattapp med SignalR",        Level="advanced", IsFree=false, Tags="csharp,javascript", Category="api",      TimeEstimate="6–8h", Description="Realtidschatt med ASP.NET Core SignalR." },
        new() { ExternalId="10", Title="SQL Databasdesign",           Level="medium",   IsFree=false, Tags="sql",               Category="databas",  TimeEstimate="3–4h", Description="Designa och bygg en komplett databas." },
        new() { ExternalId="11", Title="Markdown Editor",             Level="medium",   IsFree=false, Tags="javascript",        Category="dom",      TimeEstimate="3–4h", Description="Live Markdown-editor med preview." },
        new() { ExternalId="12", Title="Data-visualisering",          Level="medium",   IsFree=true,  Tags="javascript",        Category="api",      TimeEstimate="3–5h", Description="Interaktiva grafer med Chart.js." },
        new() { ExternalId="13", Title="AI Chatbot",                  Level="advanced", IsFree=false, Tags="javascript,python", Category="api",      TimeEstimate="4–6h", Description="Bygg din egen chatbot med GPT-API." },
        new() { ExternalId="14", Title="E-handelssida",               Level="advanced", IsFree=false, Tags="javascript",        Category="api",      TimeEstimate="8–12h",Description="Komplett nätbutik med varukorg och checkout." },
        new() { ExternalId="15", Title="Todo med localStorage",       Level="beginner", IsFree=true,  Tags="javascript",        Category="dom",      TimeEstimate="2–3h", Description="Spara uppgifter i webbläsaren." },
        new() { ExternalId="16", Title="Temperaturomvandlare",        Level="beginner", IsFree=true,  Tags="javascript",        Category="dom",      TimeEstimate="1–2h", Description="Konvertera C, F och K i realtid." },
        new() { ExternalId="17", Title="Slumpmässig färgpalett",      Level="beginner", IsFree=true,  Tags="javascript",        Category="dom",      TimeEstimate="1–2h", Description="Generera vackra färgpaletter." },
        new() { ExternalId="18", Title="Lösenordsgenerator",          Level="medium",   IsFree=true,  Tags="javascript",        Category="dom",      TimeEstimate="2–3h", Description="Säker lösenordsgenerator med crypto API." },
        new() { ExternalId="19", Title="Markdown Editor (avancerad)", Level="medium",   IsFree=false, Tags="javascript",        Category="api",      TimeEstimate="3–4h", Description="Split-screen editor med HTML-export." },
        new() { ExternalId="20", Title="Quiz-spel med timer",         Level="medium",   IsFree=false, Tags="javascript",        Category="loopar",   TimeEstimate="3–5h", Description="Interaktivt quiz med poängsystem." },
        new() { ExternalId="21", Title="Chattapp med WebSocket",      Level="medium",   IsFree=false, Tags="javascript",        Category="api",      TimeEstimate="4–6h", Description="Realtidschatt med WebSocket." },
        new() { ExternalId="22", Title="E-handelssida (fullstack)",   Level="advanced", IsFree=false, Tags="javascript",        Category="api",      TimeEstimate="8–12h",Description="Komplett nätbutik med admin-vy." },
        new() { ExternalId="23", Title="AI Chatbot med OpenAI",       Level="advanced", IsFree=false, Tags="javascript,python", Category="api",      TimeEstimate="4–6h", Description="GPT-integration med streaming." },
        new() { ExternalId="24", Title="Dashboard med realtidsdata",  Level="advanced", IsFree=false, Tags="javascript",        Category="api",      TimeEstimate="6–8h", Description="Live-grafer med Chart.js och WebSocket." },
        new() { ExternalId="25", Title="REST API med autentisering",  Level="advanced", IsFree=false, Tags="javascript,csharp", Category="api",      TimeEstimate="8–10h",Description="JWT, roller, rate limiting och Swagger." },
    ];
}
