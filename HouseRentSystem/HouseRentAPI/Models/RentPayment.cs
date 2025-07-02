using HouseRentAPI.Enums;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HouseRentAPI.Models
{
    public class RentPayment
    {
        [Key]
        public int PaymentId { get; set; }

        [Required]
        public DateTime DueDate { get; set; }

        public DateTime? PaymentDate { get; set; }
        public decimal AmountPaid { get; set; }
        public required string PaymentMethod { get; set; }
        public string? PaymentSlipPath { get; set; } // Uploaded slip path
        public PaymentStatus Status { get; set; } = PaymentStatus.Pending; // Paid/Unpaid
        public DateTime CreatedAt { get; internal set; }

        // Foreign Keys
        [ForeignKey("Lease")]
        public int LeaseId { get; set; }

        // Navigation Property
        public Lease Lease { get; set; }        
    }
}
