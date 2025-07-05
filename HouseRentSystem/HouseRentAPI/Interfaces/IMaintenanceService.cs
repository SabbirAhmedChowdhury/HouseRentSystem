using HouseRentAPI.Enums;
using HouseRentAPI.Models;

namespace HouseRentAPI.Interfaces
{
    public interface IMaintenanceService
    {
        Task<MaintenanceRequest> CreateRequestAsync(MaintenanceRequest request);
        Task UpdateRequestStatusAsync(int requestId, MaintenanceStatus status);
        Task<MaintenanceRequest> GetRequestByIdAsync(int id);
        Task<IEnumerable<MaintenanceRequest>> GetRequestsByTenantAsync(int tenantId);
        Task<IEnumerable<MaintenanceRequest>> GetRequestsByPropertyAsync(int propertyId);
        //Task AssignWorkerAsync(int requestId, int workerId);
    }
}
