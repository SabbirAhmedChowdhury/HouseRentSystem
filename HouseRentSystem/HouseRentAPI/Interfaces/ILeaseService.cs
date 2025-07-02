using HouseRentAPI.Models;

namespace HouseRentAPI.Interfaces
{
    public interface ILeaseService
    {
        Task<Lease> CreateLeaseAsync(Lease lease, int propertyId, int tenantId);
        Task EndLeaseAsync(int leaseId);
        Task RenewLeaseAsync(int leaseId, DateTime newEndDate);
        Task<Lease> GetLeaseByIdAsync(int id);
        Task<IEnumerable<Lease>> GetLeasesByTenantAsync(int tenantId);
        Task<IEnumerable<Lease>> GetLeasesByPropertyAsync(int propertyId);
        Task<string> GenerateLeaseDocumentAsync(int leaseId);
    }
}
