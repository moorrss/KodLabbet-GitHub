using KodLabbet.Models;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace KodLabbet.Services;

/// <summary>Genererar och validerar JWT och refresh tokens.</summary>
public class TokenService(IConfiguration config)
{
    private readonly string _secret = config["Jwt:Secret"]
        ?? throw new InvalidOperationException("JWT Secret saknas");

    /// <summary>Skapar en kortlivad access token (15 min).</summary>
    public string CreateAccessToken(User user)
    {
        var key   = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name,           user.Username),
            new Claim(ClaimTypes.Email,          user.Email),
            new Claim("isPro",                   user.IsPro.ToString().ToLower()),
        };

        var token = new JwtSecurityToken(
            claims:   claims,
            expires:  DateTime.UtcNow.AddMinutes(15),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    /// <summary>Skapar en kryptografisk refresh token (7 dagar).</summary>
    public RefreshToken CreateRefreshToken(int userId) => new()
    {
        Token     = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64)),
        ExpiresAt = DateTime.UtcNow.AddDays(7),
        UserId    = userId
    };

    /// <summary>Hämtar UserId från token utan att validera expiry (för refresh-flöde).</summary>
    public int? GetUserIdFromExpiredToken(string token)
    {
        var handler = new JwtSecurityTokenHandler();
        try
        {
            var jwt = handler.ReadJwtToken(token);
            var sub = jwt.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            return sub is not null ? int.Parse(sub) : null;
        }
        catch { return null; }
    }
}
