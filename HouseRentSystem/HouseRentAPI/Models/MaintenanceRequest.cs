using HouseRentAPI.Enums;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HouseRentAPI.Models
{
    public class MaintenanceRequest
    {
        [Key]
        public int RequestId { get; set; }

        [Required]
        public string Description { get; set; }

        public DateTime RequestDate { get; set; } = DateTime.UtcNow;
        public DateTime? CompletionDate { get; set; }
        public MaintenanceStatus Status { get; set; } = MaintenanceStatus.Pending; // Pending/InProgress/Resolved

        // Foreign Keys
        [ForeignKey("Property")]
        public int PropertyId { get; set; }

        [ForeignKey("Tenant")]
        public int TenantId { get; set; }

        // Navigation Properties
        public Property Property { get; set; }
        public User Tenant { get; set; }
        public int AssignedWorkerId { get; internal set; }
    }
}
