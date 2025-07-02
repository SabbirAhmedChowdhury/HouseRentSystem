using HouseRentAPI.Enums;
using System.ComponentModel.DataAnnotations;

namespace HouseRentAPI.Models
{
    public class User
    {
        public int UserId { get; set; }
        public required string FullName { get; set; }
        public required string Email { get; set; }
        public required string PasswordHash { get; set; }
        public required string PhoneNumber { get; set; }
        public required UserRole Role { get; set; }
        public required string NID { get; set; }
        public bool IsNIDVerified { get; set; }
        public DateTime CreatedAt { get; set; }
        public ICollection<Property> Properties { get; set; }
        public ICollection<Lease> Leases { get; set; }
        public ICollection<MaintenanceRequest> MaintenanceRequests { get; set; }
    }
}
