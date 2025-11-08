namespace HouseRentAPI.DTOs
{
    /// <summary>
    /// DTO for creating a new lease
    /// </summary>
    public class CreateLeaseDTO
    {
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; } // Optional end date
        public decimal MonthlyRent { get; set; }
        public string? TermsAndConditions { get; set; }
        public int PropertyId { get; set; }
        public string TenantEmail { get; set; } // Changed from TenantId to TenantEmail
    }

    /// <summary>
    /// DTO for renewing an existing lease
    /// </summary>
    public class RenewLeaseDTO
    {
        public DateTime NewEndDate { get; set; }
    }

    /// <summary>
    /// DTO for lease response with basic information
    /// </summary>
    public class LeaseResponseDTO
    {
        public int LeaseId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; } // Made nullable to match model
        public decimal MonthlyRent { get; set; }
        public string? TermsAndConditions { get; set; }
        public string? LeaseDocumentPath { get; set; }
        public DateTime CreatedAt { get; set; }
        public int PropertyId { get; set; }
        public int TenantId { get; set; }
        public bool IsActive { get; set; }
        
        // Property details
        public PropertyBasicDTO? Property { get; set; }
        
        // Tenant details
        public UserBasicDTO? Tenant { get; set; }
    }

    /// <summary>
    /// DTO for lease document response
    /// </summary>
    public class LeaseDocumentResponseDTO
    {
        public string DocumentPath { get; set; }
        public byte[] DocumentContent { get; set; }
        public string ContentType { get; set; }
    }

    /// <summary>
    /// DTO for lease list view with summary information
    /// </summary>
    public class LeaseListDTO
    {
        public int LeaseId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public decimal MonthlyRent { get; set; }
        public bool IsActive { get; set; }
        public int PropertyId { get; set; }
        public string PropertyAddress { get; set; }
        public string PropertyCity { get; set; }
        public int TenantId { get; set; }
        public string TenantName { get; set; }
        public string TenantEmail { get; set; }
    }
}
