using HouseRentAPI.Enums;
using HouseRentAPI.Exceptions;
using HouseRentAPI.Interfaces;
using HouseRentAPI.Models;

namespace HouseRentAPI.Services
{
    public class MaintenanceService : IMaintenanceService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IEmailService _emailService;

        public MaintenanceService(IUnitOfWork unitOfWork, IEmailService emailService)
        {
            _unitOfWork = unitOfWork;
            _emailService = emailService;
        }

        public async Task<MaintenanceRequest> CreateRequestAsync(MaintenanceRequest request)
        {
            var requestRepo = _unitOfWork.GetRepository<MaintenanceRequest>();
            var propertyRepo = _unitOfWork.GetRepository<Property>();
            var userRepo = _unitOfWork.GetRepository<User>();

            // Validate tenant and property
            var tenant = await userRepo.GetByIdAsync(request.TenantId);
            if (tenant == null || tenant.Role != UserRole.Tenant)
                throw new BadRequestException("Invalid tenant");

            var property = await propertyRepo.GetByIdAsync(request.PropertyId);
            //if (property == null) throw new KeyNotFoundException("Property not found");
            if (property == null) throw new NotFoundException(nameof(Property), request.PropertyId);

            request.RequestDate = DateTime.Now;
            request.Status = MaintenanceStatus.Pending;

            await requestRepo.AddAsync(request);
            await _unitOfWork.SaveChangesAsync();

            // Notify landlord
            await NotifyLandlordAsync(request, property.LandlordId);

            return request;
        }

        public async Task UpdateRequestStatusAsync(int requestId, MaintenanceStatus status)
        {
            var requestRepo = _unitOfWork.GetRepository<MaintenanceRequest>();
            var request = await requestRepo.GetByIdAsync(requestId);

            //if (request == null) throw new KeyNotFoundException("Maintenance request not found");
            if (request == null) throw new NotFoundException(nameof(MaintenanceRequest), requestId);

            request.Status = status;
            if (status == MaintenanceStatus.Resolved)
                request.CompletionDate = DateTime.Now;

            requestRepo.Update(request);
            await _unitOfWork.SaveChangesAsync();

            // Notify tenant of status change
            await NotifyTenantAsync(requestId, status);
        }

        public async Task<MaintenanceRequest> GetRequestByIdAsync(int id)
        {
            var requestRepo = _unitOfWork.GetRepository<MaintenanceRequest>();
            return await requestRepo.GetByIdAsync(
                r => r.RequestId == id,
                r => r.Property,
                r => r.Tenant
            );
        }

        public async Task<IEnumerable<MaintenanceRequest>> GetRequestsByTenantAsync(int tenantId)
        {
            var requestRepo = _unitOfWork.GetRepository<MaintenanceRequest>();
            return await requestRepo.FindAsync(
                r => r.TenantId == tenantId,
                r => r.Property
            );
        }

        public async Task<IEnumerable<MaintenanceRequest>> GetRequestsByPropertyAsync(int propertyId)
        {
            var requestRepo = _unitOfWork.GetRepository<MaintenanceRequest>();
            return await requestRepo.FindAsync(
                r => r.PropertyId == propertyId,
                r => r.Tenant
            );
        }

        //public async Task AssignWorkerAsync(int requestId, int workerId)
        //{
        //    var requestRepo = _unitOfWork.GetRepository<MaintenanceRequest>();
        //    var userRepo = _unitOfWork.GetRepository<User>();

        //    var request = await requestRepo.GetByIdAsync(requestId);
        //    //if (request == null) throw new KeyNotFoundException("Request not found");
        //    if (request == null) throw new NotFoundException(nameof(MaintenanceRequest), requestId);

        //    var worker = await userRepo.GetByIdAsync(workerId);
        //    //if (worker == null) throw new KeyNotFoundException("Worker not found");
        //    if (worker == null) throw new NotFoundException(nameof(MaintenanceRequest), requestId);

        //    request.AssignedWorkerId = workerId;
        //    request.Status = MaintenanceStatus.InProgress;

        //    requestRepo.Update(request);
        //    await _unitOfWork.SaveChangesAsync();

        //    // Notify worker
        //    //await NotifyWorkerAsync(requestId, workerId);
        //}

        private async Task NotifyLandlordAsync(MaintenanceRequest request, int landlordId)
        {
            var userRepo = _unitOfWork.GetRepository<User>();
            var landlord = await userRepo.GetByIdAsync(landlordId);

            if (landlord == null) return;

            var subject = "New Maintenance Request";
            var body = $"Dear {landlord.FullName},<br/><br/>" +
                      $"A new maintenance request has been submitted for your property at {request.Property.Address}.<br/>" +
                      $"Description: {request.Description}<br/><br/>" +
                      "Please log in to the system to review and take action.<br/><br/>" +
                      "Best regards,<br/>House Rent Management System";

            await _emailService.SendEmailAsync(landlord.Email, subject, body);
        }

        private async Task NotifyTenantAsync(int requestId, MaintenanceStatus status)
        {
            var request = await GetRequestByIdAsync(requestId);
            if (request == null) return;

            var subject = $"Maintenance Request #{requestId} Update";
            var body = $"Dear {request.Tenant.FullName},<br/><br/>" +
                      $"Your maintenance request has been updated to: {status}<br/>" +
                      (status == MaintenanceStatus.Resolved
                          ? $"Completed on: {request.CompletionDate:dd MMM yyyy}"
                          : "") +
                      "<br/><br/>Best regards,<br/>House Rent Management System";

            await _emailService.SendEmailAsync(request.Tenant.Email, subject, body);
        }

        //private async Task NotifyWorkerAsync(int requestId, int workerId)
        //{
        //    var request = await GetRequestByIdAsync(requestId);
        //    var worker = await _unitOfWork.GetRepository<User>().GetByIdAsync(workerId);

        //    if (request == null || worker == null) return;

        //    var subject = $"New Maintenance Assignment (Request #{requestId})";
        //    var body = $"Dear {worker.FullName},<br/><br/>" +
        //              $"You have been assigned to a maintenance request at {request.Property.Address}.<br/>" +
        //              $"Description: {request.Description}<br/><br/>" +
        //              "Please contact the tenant to schedule the repair.<br/><br/>" +
        //              "Best regards,<br/>House Rent Management System";

        //    await _emailService.SendEmailAsync(worker.Email, subject, body);
        //}
    }
}
