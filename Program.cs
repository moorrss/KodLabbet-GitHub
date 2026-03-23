using KodLabbet.Data;
using KodLabbet.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

// ── Databas (SQLite) ──────────────────────────────────────────────
builder.Services.AddDbContext<AppDbContext>(opts =>
    opts.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")
        ?? "Data Source=kodlabbet.db"));

// ── JWT-autentisering ─────────────────────────────────────────────
var jwtKey = builder.Configuration["Jwt:Secret"]
    ?? throw new InvalidOperationException("JWT Secret saknas i appsettings.json");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opts =>
    {
        opts.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey        = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ValidateIssuer          = false,
            ValidateAudience        = false,
            ClockSkew               = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();

// ── Tjänster ──────────────────────────────────────────────────────
builder.Services.AddScoped<IAuthService,   AuthService>();
builder.Services.AddScoped<IUserService,   UserService>();
builder.Services.AddScoped<IProjectService,ProjectService>();
builder.Services.AddScoped<ICommentService,CommentService>();
builder.Services.AddScoped<IReviewService, ReviewService>();
builder.Services.AddScoped<TokenService>();

// ── CORS ──────────────────────────────────────────────────────────
builder.Services.AddCors(opts =>
    opts.AddDefaultPolicy(policy =>
        policy.WithOrigins(
                "http://localhost:5173",   // Vite dev (om du lägger till React senare)
                Environment.GetEnvironmentVariable("ALLOWED_ORIGIN") ?? "https://www.dindomän.com")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials()));

// ── Rate Limiting (skydd mot brute-force) ─────────────────────────
builder.Services.AddRateLimiter(opts =>
{
    // Generell gräns: 100 req/min per IP
    opts.AddFixedWindowLimiter("general", o =>
    {
        o.PermitLimit         = 100;
        o.Window              = TimeSpan.FromMinutes(1);
        o.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        o.QueueLimit          = 5;
    });

    // Striktare gräns för auth-endpoints: 10 req/min
    opts.AddFixedWindowLimiter("auth", o =>
    {
        o.PermitLimit         = 10;
        o.Window              = TimeSpan.FromMinutes(1);
        o.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        o.QueueLimit          = 0;
    });

    opts.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
});

// ── Controllers + JSON ───────────────────────────────────────────
builder.Services.AddControllers()
    .AddJsonOptions(o =>
        o.JsonSerializerOptions.PropertyNamingPolicy =
            System.Text.Json.JsonNamingPolicy.CamelCase);

var app = builder.Build();

// ── Middleware-pipeline ──────────────────────────────────────────
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}
else
{
    app.UseExceptionHandler("/error");
    app.UseHsts();
    app.UseHttpsRedirection();
}

app.UseRateLimiter();
app.UseCors();
app.UseDefaultFiles();       // Servar wwwroot/index.html på /
app.UseStaticFiles();        // Servar wwwroot/
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// ── Skapa databas vid första start ───────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
    await DbSeeder.SeedAsync(db);
}

app.Run();
