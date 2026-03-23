using KodLabbet.Data;
using KodLabbet.Models;
using Microsoft.EntityFrameworkCore;

namespace KodLabbet.Services;

public interface IAuthService
{
    Task<AuthResponseDto?> RegisterAsync(RegisterDto dto);
    Task<AuthResponseDto?> LoginAsync(LoginDto dto);
    Task<AuthResponseDto?> RefreshAsync(string refreshToken);
    Task<bool>             LogoutAsync(string refreshToken);
}

public class AuthService(AppDbContext db, TokenService tokens) : IAuthService
{
    public async Task<AuthResponseDto?> RegisterAsync(RegisterDto dto)
    {
        // Validera unikhet
        if (await db.Users.AnyAsync(u => u.Email    == dto.Email.ToLower())) return null;
        if (await db.Users.AnyAsync(u => u.Username == dto.Username))        return null;

        var user = new User
        {
            Username     = dto.Username.Trim(),
            Email        = dto.Email.ToLower().Trim(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password)
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();

        return await IssueTokens(user);
    }

    public async Task<AuthResponseDto?> LoginAsync(LoginDto dto)
    {
        var user = await db.Users
            .FirstOrDefaultAsync(u => u.Email == dto.Email.ToLower().Trim());

        if (user is null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            return null;

        user.LastLogin = DateTime.UtcNow;
        await db.SaveChangesAsync();

        return await IssueTokens(user);
    }

    public async Task<AuthResponseDto?> RefreshAsync(string refreshToken)
    {
        var stored = await db.RefreshTokens
            .Include(rt => rt.User)
            .FirstOrDefaultAsync(rt => rt.Token == refreshToken);

        if (stored is null || stored.Revoked || stored.ExpiresAt < DateTime.UtcNow)
            return null;

        // Rotera: revocar gammal, skapa ny
        stored.Revoked = true;
        var newRt = tokens.CreateRefreshToken(stored.UserId);
        db.RefreshTokens.Add(newRt);
        await db.SaveChangesAsync();

        return new AuthResponseDto(
            tokens.CreateAccessToken(stored.User),
            newRt.Token,
            ToDto(stored.User));
    }

    public async Task<bool> LogoutAsync(string refreshToken)
    {
        var stored = await db.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.Token == refreshToken);
        if (stored is null) return false;
        stored.Revoked = true;
        await db.SaveChangesAsync();
        return true;
    }

    // ── Hjälpare ──────────────────────────────────────────────────

    private async Task<AuthResponseDto> IssueTokens(User user)
    {
        var rt = tokens.CreateRefreshToken(user.Id);
        db.RefreshTokens.Add(rt);
        await db.SaveChangesAsync();
        return new AuthResponseDto(tokens.CreateAccessToken(user), rt.Token, ToDto(user));
    }

    private static UserDto ToDto(User u) => new(
        u.Id, u.Username, u.Email, u.IsPro,
        u.Avatar, u.Bio, u.Xp, u.Streak, u.BestStreak, u.CreatedAt);
}
