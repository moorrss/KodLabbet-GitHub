using KodLabbet.Models;
using KodLabbet.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using System.Security.Claims;

namespace KodLabbet.Controllers;

// ════════════════════════════════════════════════════════
// AuthController  — POST /api/auth/*
// ════════════════════════════════════════════════════════
[ApiController]
[Route("api/auth")]
public class AuthController(IAuthService auth) : ControllerBase
{
    [HttpPost("register")]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Username) ||
            string.IsNullOrWhiteSpace(dto.Email)    ||
            dto.Password.Length < 8)
            return BadRequest(new ApiError("Kontrollera dina uppgifter."));

        var result = await auth.RegisterAsync(dto);
        return result is null
            ? Conflict(new ApiError("E-post eller användarnamn är redan registrerat."))
            : Ok(result);
    }

    [HttpPost("login")]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var result = await auth.LoginAsync(dto);
        return result is null
            ? Unauthorized(new ApiError("Felaktig e-post eller lösenord."))
            : Ok(result);
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshDto dto)
    {
        var result = await auth.RefreshAsync(dto.RefreshToken);
        return result is null
            ? Unauthorized(new ApiError("Ogiltig eller utgången refresh-token."))
            : Ok(result);
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout([FromBody] RefreshDto dto)
    {
        await auth.LogoutAsync(dto.RefreshToken);
        return Ok();
    }
}

// ════════════════════════════════════════════════════════
// UsersController  — GET/PUT /api/users/*
// ════════════════════════════════════════════════════════
[ApiController]
[Route("api/users")]
[Authorize]
public class UsersController(IUserService users) : ControllerBase
{
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var id = GetUserId();
        var user = await users.GetByIdAsync(id);
        return user is null ? NotFound() : Ok(user);
    }

    [HttpPut("me")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
    {
        var result = await users.UpdateProfileAsync(GetUserId(), dto);
        return result is null ? NotFound() : Ok(result);
    }

    // Hjälpare — hämtar inloggad användares ID från JWT
    private int GetUserId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}

// ════════════════════════════════════════════════════════
// ProjectsController  — GET/POST /api/projects/*
// ════════════════════════════════════════════════════════
[ApiController]
[Route("api/projects")]
public class ProjectsController(IProjectService projects) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await projects.GetAllAsync());

    [HttpGet("{id:int}/progress")]
    [Authorize]
    public async Task<IActionResult> GetProgress(int id)
    {
        var p = await projects.GetProgressAsync(GetUserId(), id);
        return p is null ? NotFound() : Ok(p);
    }

    [HttpPost("{id:int}/start")]
    [Authorize]
    public async Task<IActionResult> Start(int id) =>
        Ok(await projects.StartProjectAsync(GetUserId(), id));

    [HttpPost("{id:int}/complete")]
    [Authorize]
    public async Task<IActionResult> Complete(int id) =>
        Ok(await projects.CompleteProjectAsync(GetUserId(), id));

    [HttpGet("completed")]
    [Authorize]
    public async Task<IActionResult> GetCompleted() =>
        Ok(await projects.GetCompletedAsync(GetUserId()));

    [HttpPost("daily/complete")]
    [Authorize]
    public async Task<IActionResult> CompleteDaily([FromBody] DailyCompleteDto dto)
    {
        await projects.CompleteDailyAsync(GetUserId(), dto);
        return Ok();
    }

    private int GetUserId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}

// ════════════════════════════════════════════════════════
// CommentsController  — GET/POST/DELETE /api/projects/{id}/comments
// ════════════════════════════════════════════════════════
[ApiController]
[Route("api/projects/{projectId:int}/comments")]
public class CommentsController(ICommentService comments) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(int projectId) =>
        Ok(await comments.GetForProjectAsync(projectId));

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Add(int projectId, [FromBody] CreateCommentDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Text))
            return BadRequest(new ApiError("Kommentaren får inte vara tom."));

        var result = await comments.AddAsync(GetUserId(), projectId, dto);
        return CreatedAtAction(nameof(GetAll), new { projectId }, result);
    }

    [HttpPost("{commentId:int}/like")]
    [Authorize]
    public async Task<IActionResult> Like(int commentId) =>
        await comments.LikeAsync(commentId) ? Ok() : NotFound();

    [HttpDelete("{commentId:int}")]
    [Authorize]
    public async Task<IActionResult> Delete(int commentId)
    {
        var ok = await comments.DeleteAsync(commentId, GetUserId());
        return ok ? Ok() : Forbid();
    }

    private int GetUserId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}

// ════════════════════════════════════════════════════════
// ReviewsController  — GET/POST/DELETE /api/reviews
// ════════════════════════════════════════════════════════
[ApiController]
[Route("api/reviews")]
public class ReviewsController(IReviewService reviews) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await reviews.GetAllAsync());

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Add([FromBody] CreateReviewDto dto)
    {
        if (dto.Stars < 1 || dto.Stars > 5 || dto.Quote.Trim().Length < 30)
            return BadRequest(new ApiError("Ogiltigt betyg eller för kort recension."));

        var result = await reviews.AddAsync(GetUserId(), dto);
        return result is null
            ? Conflict(new ApiError("Du har redan lämnat en recension."))
            : CreatedAtAction(nameof(GetAll), result);
    }

    [HttpPost("{id:int}/like")]
    [Authorize]
    public async Task<IActionResult> Like(int id) =>
        await reviews.LikeAsync(id) ? Ok() : NotFound();

    [HttpDelete("{id:int}")]
    [Authorize]
    public async Task<IActionResult> Delete(int id)
    {
        var ok = await reviews.DeleteAsync(id, GetUserId());
        return ok ? Ok() : Forbid();
    }

    private int GetUserId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
