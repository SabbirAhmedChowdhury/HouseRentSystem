namespace HouseRentAPI.Data
{
    using HouseRentAPI.Models;
    using Microsoft.EntityFrameworkCore;

    public class HouseRentContext : DbContext
    {
        public HouseRentContext(DbContextOptions<HouseRentContext> options)
            : base(options)
        {
        }

        // Define DbSets for each model
        public DbSet<User> Users { get; set; }
        public DbSet<Property> Properties { get; set; }
        public DbSet<Lease> Leases { get; set; }
        public DbSet<RentPayment> RentPayments { get; set; }
        public DbSet<MaintenanceRequest> MaintenanceRequests { get; set; }
        public DbSet<UtilityBill> UtilityBills { get; set; }
        public DbSet<PropertyImage> PropertyImages { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // User -> Property (Landlord relationship)
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasMany(u => u.Properties)
                      .WithOne(p => p.Landlord)
                      .HasForeignKey(p => p.LandlordId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // Property -> Lease (One property can have multiple leases over time)
            modelBuilder.Entity<Property>(entity =>
            {
                entity.HasMany(p => p.Leases)
                      .WithOne(l => l.Property)
                      .HasForeignKey(l => l.PropertyId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // Lease -> Tenant relationship
            modelBuilder.Entity<Lease>(entity =>
            {
                entity.HasOne(l => l.Tenant)
                      .WithMany(u => u.Leases)
                      .HasForeignKey(l => l.TenantId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // Lease -> Rent Payments (One lease has multiple payments)
            modelBuilder.Entity<Lease>(entity =>
            {
                entity.HasMany(l => l.RentPayments)
                      .WithOne(rp => rp.Lease)
                      .HasForeignKey(rp => rp.LeaseId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // Property -> Maintenance Requests
            modelBuilder.Entity<Property>(entity =>
            {
                entity.HasMany(p => p.MaintenanceRequests)
                      .WithOne(mr => mr.Property)
                      .HasForeignKey(mr => mr.PropertyId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // Tenant -> Maintenance Requests
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasMany(u => u.MaintenanceRequests)
                      .WithOne(mr => mr.Tenant)
                      .HasForeignKey(mr => mr.TenantId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // Property -> Utility Bills
            modelBuilder.Entity<Property>(entity =>
            {
                entity.HasMany(p => p.UtilityBills)
                      .WithOne(ub => ub.Property)
                      .HasForeignKey(ub => ub.PropertyId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // Property -> Images
            modelBuilder.Entity<Property>(entity =>
            {
                entity.HasMany(p => p.Images)
                      .WithOne(pi => pi.Property)
                      .HasForeignKey(pi => pi.PropertyId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // Unique Constraints
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasIndex(u => u.Email).IsUnique();
                entity.HasIndex(u => u.NID).IsUnique();
                entity.Property(u => u.Role)
                      .HasConversion<string>()
                      .HasMaxLength(20);
            });

            // RentPayment Status Constraint
            modelBuilder.Entity<RentPayment>(entity =>
            {
                entity.Property(rp => rp.Status)
                      .HasConversion<string>()
                      .HasMaxLength(20);
            });

            // MaintenanceRequest Status Constraint
            modelBuilder.Entity<MaintenanceRequest>(entity =>
            {
                entity.Property(mr => mr.Status)
                      .HasConversion<string>()
                      .HasMaxLength(20);
            });

            // Seed Admin User
            //modelBuilder.Entity<User>().HasData(
            //    new User
            //    {
            //        UserId = 1,
            //        FullName = "Admin User",
            //        Email = "admin@hrms.com",
            //        PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"),
            //        PhoneNumber = "+8801122334455",
            //        Role = Enums.UserRole.Admin,
            //        NID = "ADMIN12345",
            //        IsNIDVerified = true,
            //        CreatedAt = DateTime.Now
            //    }
            //);
        }
    }
}
