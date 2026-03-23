using KodLabbet.Data;
using KodLabbet.Models;
using Microsoft.EntityFrameworkCore;

namespace KodLabbet.Services;

// ════════════════════════════════════════════════════════
// UserService
// ════════════════════════════════════════════════════════
public interface IUserService
{
    Task<UserDto?> GetByIdAsync(int id);
    Task<UserDto?> UpdateProfileAsync(int userId, UpdateProfileDto dto);
    Task<bool>     AddXpAsync(int userId, int amount);
}

public class UserService(AppDbContext db) : IUserService
{
    public async Task<UserDto?> GetByIdAsync(int id)
    {
        var u = await db.Users.FindAsync(id);
        return u is null ? null : ToDto(u);
    }

    public async Task<UserDto?> UpdateProfileAsync(int userId, UpdateProfileDto dto)
    {
        var u = await db.Users.FindAsync(userId);
        if (u is null) return null;

        if (dto.Username is not null) u.Username = dto.Username.Trim();
        if (dto.Avatar   is not null) u.Avatar   = dto.Avatar;
        if (dto.Bio      is not null) u.Bio       = dto.Bio.Trim();

        await db.SaveChangesAsync();
        return ToDto(u);
    }

    public async Task<bool> AddXpAsync(int userId, int amount)
    {
        var u = await db.Users.FindAsync(userId);
        if (u is null) return false;
        u.Xp += amount;
        await db.SaveChangesAsync();
        return true;
    }

    private static UserDto ToDto(User u) => new(
        u.Id, u.Username, u.Email, u.IsPro,
        u.Avatar, u.Bio, u.Xp, u.Streak, u.BestStreak, u.CreatedAt);
}

// ════════════════════════════════════════════════════════
// ProjectService
// ════════════════════════════════════════════════════════
public interface IProjectService
{
    Task<List<Project>>   GetAllAsync();
    Task<UserProject?>    GetProgressAsync(int userId, int projectId);
    Task<UserProject>     StartProjectAsync(int userId, int projectId);
    Task<UserProject?>    CompleteProjectAsync(int userId, int projectId);
    Task<List<UserProject>> GetCompletedAsync(int userId);
    Task                  CompleteDailyAsync(int userId, DailyCompleteDto dto);
}

public class ProjectService(AppDbContext db) : IProjectService
{
    public Task<List<Project>> GetAllAsync() =>
        db.Projects.OrderBy(p => p.ExternalId).ToListAsync();

    public Task<UserProject?> GetProgressAsync(int userId, int projectId) =>
        db.UserProjects.FirstOrDefaultAsync(up =>
            up.UserId == userId && up.ProjectId == projectId);

    public async Task<UserProject> StartProjectAsync(int userId, int projectId)
    {
        var existing = await GetProgressAsync(userId, projectId);
        if (existing is not null) return existing;

        var up = new UserProject { UserId = userId, ProjectId = projectId };
        db.UserProjects.Add(up);
        await db.SaveChangesAsync();
        return up;
    }

    public async Task<UserProject?> CompleteProjectAsync(int userId, int projectId)
    {
        var up = await GetProgressAsync(userId, projectId)
                 ?? await StartProjectAsync(userId, projectId);

        if (up.Status == "completed") return up;

        up.Status      = "completed";
        up.CompletedAt = DateTime.UtcNow;
        up.XpEarned    = 50;

        // XP till användaren
        var user = await db.Users.FindAsync(userId);
        if (user is not null) user.Xp += 50;

        await db.SaveChangesAsync();
        return up;
    }

    public Task<List<UserProject>> GetCompletedAsync(int userId) =>
        db.UserProjects
          .Include(up => up.Project)
          .Where(up => up.UserId == userId && up.Status == "completed")
          .ToListAsync();

    public async Task CompleteDailyAsync(int userId, DailyCompleteDto dto)
    {
        // Undvik dubbletter samma dag
        if (await db.DailyCompletions.AnyAsync(d =>
                d.UserId == userId && d.Date == dto.Date))
            return;

        db.DailyCompletions.Add(new DailyCompletion
        {
            UserId       = userId,
            Date         = dto.Date,
            ProblemIndex = dto.ProblemIndex,
            XpEarned     = dto.XpEarned
        });

        var user = await db.Users.FindAsync(userId);
        if (user is not null)
        {
            user.Xp     += dto.XpEarned;
            user.Streak += 1;
            if (user.Streak > user.BestStreak)
                user.BestStreak = user.Streak;
        }

        await db.SaveChangesAsync();
    }
}

// ════════════════════════════════════════════════════════
// CommentService
// ════════════════════════════════════════════════════════
public interface ICommentService
{
    Task<List<CommentDto>> GetForProjectAsync(int projectId);
    Task<CommentDto>       AddAsync(int userId, int projectId, CreateCommentDto dto);
    Task<bool>             LikeAsync(int commentId);
    Task<bool>             DeleteAsync(int commentId, int userId);
}

public class CommentService(AppDbContext db) : ICommentService
{
    public async Task<List<CommentDto>> GetForProjectAsync(int projectId)
    {
        var all = await db.Comments
            .Include(c => c.User)
            .Where(c => c.ProjectId == projectId && c.ParentId == null)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();

        // Hämta svar separat
        var ids    = all.Select(c => c.Id).ToList();
        var replies = await db.Comments
            .Include(c => c.User)
            .Where(c => c.ParentId != null && ids.Contains(c.ParentId!.Value))
            .ToListAsync();

        return all.Select(c => ToDto(c,
            replies.Where(r => r.ParentId == c.Id).ToList())).ToList();
    }

    public async Task<CommentDto> AddAsync(int userId, int projectId, CreateCommentDto dto)
    {
        var comment = new Comment
        {
            Text      = dto.Text.Trim(),
            UserId    = userId,
            ProjectId = projectId,
            ParentId  = dto.ParentId
        };
        db.Comments.Add(comment);

        // +2 XP för att kommentera
        var user = await db.Users.FindAsync(userId);
        if (user is not null) user.Xp += 2;

        await db.SaveChangesAsync();
        await db.Entry(comment).Reference(c => c.User).LoadAsync();

        return ToDto(comment, []);
    }

    public async Task<bool> LikeAsync(int commentId)
    {
        var c = await db.Comments.FindAsync(commentId);
        if (c is null) return false;
        c.Likes++;
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int commentId, int userId)
    {
        var c = await db.Comments.FindAsync(commentId);
        if (c is null || c.UserId != userId) return false;
        db.Comments.Remove(c);
        await db.SaveChangesAsync();
        return true;
    }

    private static CommentDto ToDto(Comment c, List<Comment> replies) => new(
        c.Id, c.Text, c.Likes, c.CreatedAt,
        c.User.Username, c.User.Avatar,
        c.ParentId,
        replies.Select(r => ToDto(r, [])).ToList());
}

// ════════════════════════════════════════════════════════
// ReviewService
// ════════════════════════════════════════════════════════
public interface IReviewService
{
    Task<List<ReviewDto>> GetAllAsync();
    Task<ReviewDto?>      AddAsync(int userId, CreateReviewDto dto);
    Task<bool>            LikeAsync(int reviewId);
    Task<bool>            DeleteAsync(int reviewId, int userId);
}

public class ReviewService(AppDbContext db) : IReviewService
{
    public async Task<List<ReviewDto>> GetAllAsync() =>
        (await db.Reviews
            .Include(r => r.User)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync())
        .Select(ToDto).ToList();

    public async Task<ReviewDto?> AddAsync(int userId, CreateReviewDto dto)
    {
        // Max en recension per användare
        if (await db.Reviews.AnyAsync(r => r.UserId == userId))
            return null;

        var review = new Review
        {
            Stars  = Math.Clamp(dto.Stars, 1, 5),
            Quote  = dto.Quote.Trim(),
            Role   = dto.Role.Trim(),
            UserId = userId
        };
        db.Reviews.Add(review);

        // +10 XP för recension
        var user = await db.Users.FindAsync(userId);
        if (user is not null) user.Xp += 10;

        await db.SaveChangesAsync();
        await db.Entry(review).Reference(r => r.User).LoadAsync();
        return ToDto(review);
    }

    public async Task<bool> LikeAsync(int reviewId)
    {
        var r = await db.Reviews.FindAsync(reviewId);
        if (r is null) return false;
        r.Helpful++;
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int reviewId, int userId)
    {
        var r = await db.Reviews.FindAsync(reviewId);
        if (r is null || r.UserId != userId) return false;
        db.Reviews.Remove(r);
        await db.SaveChangesAsync();
        return true;
    }

    private static ReviewDto ToDto(Review r) => new(
        r.Id, r.Stars, r.Quote, r.Role, r.Helpful,
        r.CreatedAt, r.User.Username, r.User.Avatar);
}
