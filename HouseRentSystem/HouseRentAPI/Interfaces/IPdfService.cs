using HouseRentAPI.Models;

namespace HouseRentAPI.Interfaces
{
    public interface IPdfService
    {
        Task<byte[]> GenerateLeaseAgreementAsync(Lease lease);
        Task<byte[]> GenerateRentReceiptAsync(RentPayment payment);
        Task<byte[]> GenerateMaintenanceReportAsync(int propertyId);
        Task<byte[]> GenerateFinancialReportAsync(int landlordId, DateTime startDate, DateTime endDate);
        Task<byte[]> GenerateFromHtmlAsync(string htmlContent);
    }
}
