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
        
        /// <summary>
        /// Type of payment (Rent or SecurityDeposit). Defaults to Rent if not specified.
        /// </summary>
        public PaymentType PaymentType { get; set; } = PaymentType.Rent;
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
        public PaymentType PaymentType { get; set; }
        public DateTime CreatedAt { get; set; }
        public int LeaseId { get; set; }
        public LeaseBasicDTO Lease { get; set; }
        public decimal LateFee { get; set; }
    }

    /// <summary>
    /// Basic lease information for payment DTOs
    /// </summary>
    public class LeaseBasicDTO
    {
        public int LeaseId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; } // Made nullable to support open-ended leases
        public decimal MonthlyRent { get; set; }
        public PropertyBasicDTO Property { get; set; }
        public UserBasicDTO Tenant { get; set; }
    }

    /// <summary>
    /// Basic property information for payment DTOs
    /// </summary>
    public class PropertyBasicDTO
    {
        public int PropertyId { get; set; }
        public string Address { get; set; }
        public string City { get; set; }
        public decimal RentAmount { get; set; }
    }

    /// <summary>
    /// Basic user information for payment DTOs
    /// </summary>
    public class UserBasicDTO
    {
        public int UserId { get; set; }
        public string FullName { get; set; }
        public string Email { get; set; }
        public string PhoneNumber { get; set; }
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
        public PaymentType PaymentType { get; set; }
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