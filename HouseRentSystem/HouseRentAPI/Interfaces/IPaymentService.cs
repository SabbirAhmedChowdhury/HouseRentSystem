using HouseRentAPI.Enums;
using HouseRentAPI.Models;

namespace HouseRentAPI.Interfaces
{
    public interface IPaymentService
    {
        /// <summary>
        /// Creates a payment record (rent or security deposit)
        /// </summary>
        Task<RentPayment> CreatePaymentRecordAsync(int leaseId, decimal amount, DateTime dueDate, PaymentType paymentType = PaymentType.Rent);
        Task UpdatePaymentStatusAsync(int paymentId, PaymentStatus paymentStatus);
        Task UploadPaymentSlipAsync(int paymentId, IFormFile slipFile);
        Task<IEnumerable<RentPayment>> GetPaymentsByLeaseAsync(int leaseId);
        Task<IEnumerable<RentPayment>> GetOverduePaymentsAsync();
        Task SendRentReminderAsync(int paymentId);
        Task<IEnumerable<RentPayment>> GetPaymentsByDueDateAsync(DateTime dueDate);
        Task<RentPayment> GetPaymentAsync(int paymentId);
        Task<IEnumerable<RentPayment>> GetPaymentHistoryAsync(int tenantId);
        //Task<decimal> CalculateLateFeeAsync(int id);
        Task VerifyPaymentAsync(int id);
        /// <summary>
        /// Gets all payments for properties owned by a specific landlord
        /// </summary>
        Task<IEnumerable<RentPayment>> GetPaymentsByLandlordAsync(int landlordId);
        /// <summary>
        /// Gets all pending payments for a specific tenant
        /// </summary>
        Task<IEnumerable<RentPayment>> GetPendingPaymentsByTenantAsync(int tenantId);
        
        /// <summary>
        /// Creates a security deposit payment record when a lease is created
        /// </summary>
        Task<RentPayment> CreateSecurityDepositPaymentAsync(int leaseId, decimal amount);
        
        /// <summary>
        /// Generates monthly rent payment records for all active leases
        /// Checks for existing payments and creates new ones for upcoming months
        /// </summary>
        Task<int> GenerateMonthlyRentPaymentsAsync();
        
        /// <summary>
        /// Generates monthly rent payment for a specific active lease
        /// Creates payment for the next month if it doesn't exist
        /// </summary>
        Task<RentPayment?> GenerateRentPaymentForLeaseAsync(int leaseId);
    }
}
