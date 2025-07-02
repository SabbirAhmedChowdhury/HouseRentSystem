using HouseRentAPI.Enums;
using HouseRentAPI.Interfaces;
using HouseRentAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace HouseRentAPI.Services
{
    public class LeaseService : ILeaseService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IPdfService _pdfService;

        public LeaseService(IUnitOfWork unitOfWork, IPdfService pdfService)
        {
            _unitOfWork = unitOfWork;
            _pdfService = pdfService;
        }

        public async Task<Lease> CreateLeaseAsync(Lease lease, int propertyId, int tenantId)
        {
            var leaseRepo = _unitOfWork.GetRepository<Lease>();
            var propertyRepo = _unitOfWork.GetRepository<Property>();
            var userRepo = _unitOfWork.GetRepository<User>();

            // Validate property
            var property = await propertyRepo.GetByIdAsync(propertyId);
            if (property == null || !property.IsAvailable)
                throw new InvalidOperationException("Property not available");

            // Validate tenant
            var tenant = await userRepo.GetByIdAsync(tenantId);
            if (tenant == null || tenant.Role != UserRole.Tenant || !tenant.IsNIDVerified)
                throw new InvalidOperationException("Invalid tenant");

            // Check for overlapping leases
            bool hasOverlap = await leaseRepo.AnyAsync(l =>
                l.PropertyId == propertyId &&
                l.EndDate >= lease.StartDate &&
                l.StartDate <= lease.EndDate);

            if (hasOverlap)
                throw new InvalidOperationException("Property already leased for this period");

            lease.PropertyId = propertyId;
            lease.TenantId = tenantId;
            lease.CreatedAt = DateTime.UtcNow;

            // Update property status
            property.IsAvailable = false;
            propertyRepo.Update(property);

            await leaseRepo.AddAsync(lease);
            await _unitOfWork.SaveChangesAsync();

            return lease;
        }

        public async Task EndLeaseAsync(int leaseId)
        {
            var leaseRepo = _unitOfWork.GetRepository<Lease>();
            var propertyRepo = _unitOfWork.GetRepository<Property>();

            var lease = await leaseRepo.GetByIdAsync(leaseId);
            if (lease == null) throw new KeyNotFoundException("Lease not found");

            // Update lease
            lease.EndDate = DateTime.UtcNow;
            leaseRepo.Update(lease);

            // Mark property as available
            var property = await propertyRepo.GetByIdAsync(lease.PropertyId);
            if (property != null)
            {
                property.IsAvailable = true;
                propertyRepo.Update(property);
            }

            await _unitOfWork.SaveChangesAsync();
        }

        public async Task RenewLeaseAsync(int leaseId, DateTime newEndDate)
        {
            var leaseRepo = _unitOfWork.GetRepository<Lease>();
            var lease = await leaseRepo.GetByIdAsync(leaseId);

            if (lease == null) throw new KeyNotFoundException("Lease not found");
            if (newEndDate <= lease.EndDate)
                throw new InvalidOperationException("New end date must be after current end date");

            lease.EndDate = newEndDate;
            leaseRepo.Update(lease);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task<Lease> GetLeaseByIdAsync(int id)
        {
            var leaseRepo = _unitOfWork.GetRepository<Lease>();
            return await leaseRepo.GetByIdAsync(
                l => l.LeaseId == id,
                l => l.Property,
                l => l.Property.Images,
                l => l.Tenant,
                l => l.RentPayments
            );
        }

        public async Task<IEnumerable<Lease>> GetLeasesByTenantAsync(int tenantId)
        {
            var leaseRepo = _unitOfWork.GetRepository<Lease>();
            return await leaseRepo.FindAsync(
                l => l.TenantId == tenantId,
                l => l.Property,
                l => l.Property.Images
            );
        }

        public async Task<IEnumerable<Lease>> GetLeasesByPropertyAsync(int propertyId)
        {
            var leaseRepo = _unitOfWork.GetRepository<Lease>();
            return await leaseRepo.FindAsync(
                l => l.PropertyId == propertyId,
                l => l.Tenant
            );
        }

        public async Task<string> GenerateLeaseDocumentAsync(int leaseId)
        {
            var lease = await GetLeaseByIdAsync(leaseId);
            if (lease == null) throw new KeyNotFoundException("Lease not found");

            var leaseDocumentBytes = await _pdfService.GenerateLeaseAgreementAsync(lease);

            // Convert byte[] to a base64 string or save the document to a file and return the path
            var leaseDocumentPath = $"LeaseDocuments/Lease_{leaseId}.pdf";
            await File.WriteAllBytesAsync(leaseDocumentPath, leaseDocumentBytes);

            return leaseDocumentPath;
        }
    }
}
