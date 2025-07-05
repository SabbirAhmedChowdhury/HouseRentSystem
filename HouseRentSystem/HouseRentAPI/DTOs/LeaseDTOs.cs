namespace HouseRentAPI.DTOs
{
    public class CreateLeaseDTO
    {
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public decimal MonthlyRent { get; set; }
        public string TermsAndConditions { get; set; }
        public int PropertyId { get; set; }
        public int TenantId { get; set; }
    }

    public class RenewLeaseDTO
    {
        public DateTime NewEndDate { get; set; }
    }

    public class LeaseResponseDTO
    {
        public int LeaseId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public decimal MonthlyRent { get; set; }
        public string TermsAndConditions { get; set; }
        public string LeaseDocumentPath { get; set; }
        public DateTime CreatedAt { get; set; }
        public int PropertyId { get; set; }
        public int TenantId { get; set; }
    }

    public class LeaseDocumentResponseDTO
    {
        public string DocumentPath { get; set; }
        public byte[] DocumentContent { get; set; }
        public string ContentType { get; set; }
    }

}
