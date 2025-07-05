using HouseRentAPI.Enums;
using System.ComponentModel.DataAnnotations;

namespace HouseRentAPI.DTOs
{
    public class CreateMaintenanceRequestDTO
    {
        [Required]
        public string Description { get; set; }

        [Required]
        public int PropertyId { get; set; }

        [Required]
        public int TenantId { get; set; }
    }

    public class UpdateMaintenanceStatusDTO
    {
        [Required]
        public MaintenanceStatus Status { get; set; }
    }

    public class AssignWorkerDTO
    {
        [Required]
        public int WorkerId { get; set; }
    }

    public class MaintenanceResponseDTO
    {
        public int RequestId { get; set; }
        public string Description { get; set; }
        public DateTime RequestDate { get; set; }
        public DateTime? CompletionDate { get; set; }
        public MaintenanceStatus Status { get; set; }
        public int PropertyId { get; set; }
        public int TenantId { get; set; }
        public int? AssignedWorkerId { get; set; }
        public PropertyBasicDTO Property { get; set; }
        public UserBasicDTO Tenant { get; set; }
        public UserBasicDTO Worker { get; set; }
    }

    public class PropertyBasicDTO
    {
        public int PropertyId { get; set; }
        public string Address { get; set; }
        public string City { get; set; }
    }

    public class UserBasicDTO
    {
        public int UserId { get; set; }
        public string FullName { get; set; }
        public string Email { get; set; }
        public string PhoneNumber { get; set; }
    }
}
