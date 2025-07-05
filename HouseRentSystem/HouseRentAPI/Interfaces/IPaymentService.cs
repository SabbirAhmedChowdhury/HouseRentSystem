using HouseRentAPI.Enums;
using HouseRentAPI.Models;

namespace HouseRentAPI.Interfaces
{
    public interface IPaymentService
    {
        Task<RentPayment> CreatePaymentRecordAsync(int leaseId, decimal amount, DateTime dueDate);
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
    }
}
