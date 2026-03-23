namespace KodLabbet.Models;

// ── Användare ─────────────────────────────────────────────────────
public class User
{
    public int Id { get; set; }
    public string Username { get; set; } = "";
    public string Email { get; set; } = "";
    public string PasswordHash { get; set; } = "";
    public bool IsPro { get; set; } = false;
    public string Avatar { get; set; } = "🧑‍💻";
    public string Bio { get; set; } = "";
    public int Xp { get; set; } = 0;
    public int Streak { get; set; } = 0;
    public int BestStreak { get; set; } = 0;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastLogin { get; set; }

    // Navigeringsegenskaper
    public ICollection<RefreshToken> RefreshTokens { get; set; } = [];
    public ICollection<UserProject> UserProjects { get; set; } = [];
    public ICollection<Comment> Comments { get; set; } = [];
    public ICollection<Review> Reviews { get; set; } = [];
    public ICollection<DailyCompletion> DailyCompletions { get; set; } = [];
}

// ── JWT Refresh Token ─────────────────────────────────────────────
public class RefreshToken
{
    public int Id { get; set; }
    public string Token { get; set; } = "";
    public DateTime ExpiresAt { get; set; }
    public bool Revoked { get; set; } = false;
    public int UserId { get; set; }
    public User User { get; set; } = null!;
}

// ── Projekt (statisk data + user-progress) ────────────────────────
public class Project
{
    public int Id { get; set; }
    public string ExternalId { get; set; } = "";   // Matchar JS id (1–25)
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public string Level { get; set; } = "beginner"; // beginner/medium/advanced
    public string Category { get; set; } = "";
    public string Tags { get; set; } = "";    // kommaseparerad
    public string TimeEstimate { get; set; } = "";
    public bool IsFree { get; set; } = true;

    public ICollection<UserProject> UserProjects { get; set; } = [];
    public ICollection<Comment> Comments { get; set; } = [];
}

// ── Koppling: Användare ↔ Projekt ────────────────────────────────
public class UserProject
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int ProjectId { get; set; }
    public string Status { get; set; } = "started"; // started/completed
    public int XpEarned { get; set; } = 0;
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }

    public User User { get; set; } = null!;
    public Project Project { get; set; } = null!;
}

// ── Kommentar på projekt ──────────────────────────────────────────
public class Comment
{
    public int Id { get; set; }
    public string Text { get; set; } = "";
    public int Likes { get; set; } = 0;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public int ProjectId { get; set; }
    public Project Project { get; set; } = null!;
    public int? ParentId { get; set; }   // null = toppnivå, annars svar
    public Comment? Parent { get; set; }
    public ICollection<Comment> Replies { get; set; } = [];
}

// ── Recension av plattformen ──────────────────────────────────────
public class Review
{
    public int Id { get; set; }
    public int Stars { get; set; }           // 1–5
    public string Quote { get; set; } = "";
    public string Role { get; set; } = "";
    public int Helpful { get; set; } = 0;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public int UserId { get; set; }
    public User User { get; set; } = null!;
}

// ── Daglig utmaning – slutförd av användare ───────────────────────
public class DailyCompletion
{
    public int Id { get; set; }
    public string Date { get; set; } = "";
    public int ProblemIndex { get; set; }
    public int XpEarned { get; set; }
    public DateTime CompletedAt { get; set; } = DateTime.UtcNow;

    public int UserId { get; set; }
    public User User { get; set; } = null!;
}

// ── DTO:er (Data Transfer Objects) ───────────────────────────────

public record RegisterDto(
    string Username,
    string Email,
    string Password);

public record LoginDto(
    string Email,
    string Password);

public record AuthResponseDto(
    string AccessToken,
    string RefreshToken,
    UserDto User);

public record RefreshDto(string RefreshToken);

public record UserDto(
    int Id,
    string Username,
    string Email,
    bool IsPro,
    string Avatar,
    string Bio,
    int Xp,
    int Streak,
    int BestStreak,
    DateTime CreatedAt);

public record UpdateProfileDto(
    string? Username,
    string? Avatar,
    string? Bio);

public record CommentDto(
    int Id,
    string Text,
    int Likes,
    DateTime CreatedAt,
    string Username,
    string Avatar,
    int? ParentId,
    List<CommentDto> Replies);

public record CreateCommentDto(
    string Text,
    int? ParentId);

public record ReviewDto(
    int Id,
    int Stars,
    string Quote,
    string Role,
    int Helpful,
    DateTime CreatedAt,
    string Username,
    string Avatar);

public record CreateReviewDto(
    int Stars,
    string Quote,
    string Role);

public record CompleteProjectDto(int ProjectId);

public record DailyCompleteDto(
    string Date,
    int ProblemIndex,
    int XpEarned);

public record ApiError(string Message);
