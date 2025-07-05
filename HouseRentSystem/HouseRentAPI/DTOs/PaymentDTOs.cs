using HouseRentAPI.Enums;
using System.ComponentModel.DataAnnotations;

namespace HouseRentAPI.DTOs
{
    public class CreatePaymentRecordDTO
    {
        [Required]
        public int LeaseId { get; set; }

        [Required]
        [Range(0.01, double.MaxValue, ErrorMessage = "Amount must be positive")]
        public decimal Amount { get; set; }

        [Required]
        [FutureDate(ErrorMessage = "Due date must be in the future")]
        public DateTime DueDate { get; set; }
    }

    public class UpdatePaymentStatusDTO
    {
        [Required]
        public PaymentStatus Status { get; set; }
    }

    public class PaymentResponseDTO
    {
        public int PaymentId { get; set; }
        public DateTime DueDate { get; set; }
        public DateTime? PaymentDate { get; set; }
        public decimal AmountPaid { get; set; }
        public string PaymentMethod { get; set; }
        public string PaymentSlipPath { get; set; }
        public PaymentStatus Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public int LeaseId { get; set; }
        public LeaseBasicDTO Lease { get; set; }
        public decimal LateFee { get; set; }
    }

    public class LeaseBasicDTO
    {
        public int LeaseId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public decimal MonthlyRent { get; set; }
        public PropertyBasicDTO Property { get; set; }
        public UserBasicDTO Tenant { get; set; }
    }

    public class LateFeeResponseDTO
    {
        public int PaymentId { get; set; }
        public decimal LateFee { get; set; }
    }

    public class PaymentHistoryResponseDTO
    {
        public int PaymentId { get; set; }
        public DateTime DueDate { get; set; }
        public DateTime? PaymentDate { get; set; }
        public decimal AmountPaid { get; set; }
        public PaymentStatus Status { get; set; }
        public string PropertyAddress { get; set; }
    }

    // Custom validation attribute for future dates
    public class FutureDateAttribute : ValidationAttribute
    {
        public override bool IsValid(object value)
        {
            return value is DateTime date && date > DateTime.Now;
        }
    }
}