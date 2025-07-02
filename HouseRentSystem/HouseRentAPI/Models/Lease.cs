using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HouseRentAPI.Models
{
    public class Lease
    {
        public int LeaseId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public decimal MonthlyRent { get; set; }
        public string? TermsAndConditions { get; set; }
        public string? LeaseDocumentPath { get; set; }
        public DateTime CreatedAt { get; internal set; }
        public int PropertyId { get; set; }
        public int TenantId { get; set; }
        public Property Property { get; set; }
        public User Tenant { get; set; }

        // Add the missing RentPayments property
        public ICollection<RentPayment> RentPayments { get; set; }        
    }
}
