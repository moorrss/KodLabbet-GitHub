using KodLabbet.Models;
using Microsoft.EntityFrameworkCore;

namespace KodLabbet.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User>            Users            { get; set; }
    public DbSet<RefreshToken>    RefreshTokens    { get; set; }
    public DbSet<Project>         Projects         { get; set; }
    public DbSet<UserProject>     UserProjects     { get; set; }
    public DbSet<Comment>         Comments         { get; set; }
    public DbSet<Review>          Reviews          { get; set; }
    public DbSet<DailyCompletion> DailyCompletions { get; set; }

    protected override void OnModelCreating(ModelBuilder mb)
    {
        // User — unika constraints
        mb.Entity<User>()
          .HasIndex(u => u.Email).IsUnique();
        mb.Entity<User>()
          .HasIndex(u => u.Username).IsUnique();

        // Kommentarer — self-referencing (svar)
        mb.Entity<Comment>()
          .HasOne(c => c.Parent)
          .WithMany(c => c.Replies)
          .HasForeignKey(c => c.ParentId)
          .OnDelete(DeleteBehavior.Restrict);

        // UserProject — sammansatt unik nyckel
        mb.Entity<UserProject>()
          .HasIndex(up => new { up.UserId, up.ProjectId })
          .IsUnique();

        // RefreshToken — cascade delete när user tas bort
        mb.Entity<RefreshToken>()
          .HasOne(rt => rt.User)
          .WithMany(u => u.RefreshTokens)
          .HasForeignKey(rt => rt.UserId)
          .OnDelete(DeleteBehavior.Cascade);
    }
}
