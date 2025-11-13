using HouseRentAPI.Enums;
using HouseRentAPI.Exceptions;
using HouseRentAPI.Interfaces;
using HouseRentAPI.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace HouseRentAPI.Services
{
    /// <summary>
    /// Service for managing lease operations
    /// Handles lease creation, renewal, termination, and retrieval
    /// </summary>
    public class LeaseService : ILeaseService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IPdfService _pdfService;
        private readonly IConfiguration _configuration;
        private readonly IWebHostEnvironment _env;
        private readonly IPaymentService _paymentService;
        private readonly string _baseStoragePath;

        public LeaseService(
            IUnitOfWork unitOfWork, 
            IPdfService pdfService, 
            IConfiguration configuration, 
            IWebHostEnvironment env,
            IPaymentService paymentService)
        {
            _unitOfWork = unitOfWork;
            _pdfService = pdfService;
            _configuration = configuration;
            _env = env;
            _paymentService = paymentService;

            // Get base storage path from config or use default
            _baseStoragePath = _configuration["FileStorage:BasePath"] ?? Path.Combine(_env.ContentRootPath, "FileStorage");
        }

        /// <summary>
        /// Creates a new lease agreement between a landlord and tenant
        /// Validates property availability, tenant eligibility, and prevents overlapping leases
        /// Tenant is identified by email address
        /// </summary>
        /// <param name="lease">Lease entity with lease details</param>
        /// <param name="propertyId">ID of the property being leased</param>
        /// <param name="tenantEmail">Email address of the tenant</param>
        /// <returns>Created lease entity</returns>
        public async Task<Lease> CreateLeaseAsync(Lease lease, int propertyId, string tenantEmail)
        {
            var leaseRepo = _unitOfWork.GetRepository<Lease>();
            var propertyRepo = _unitOfWork.GetRepository<Property>();
            var userRepo = _unitOfWork.GetRepository<User>();

            // Validate property
            var property = await propertyRepo.GetByIdAsync(propertyId);
            if (property == null || !property.IsAvailable)
                throw new BadRequestException("Property not available");

            // Validate tenant by email
            var tenant = await userRepo.FirstOrDefaultAsync(u => u.Email == tenantEmail);
            if (tenant == null)
                throw new BadRequestException($"Tenant with email '{tenantEmail}' not found");
            if (tenant.Role != UserRole.Tenant)
                throw new BadRequestException("User is not a tenant");
            //if (!tenant.IsNIDVerified)
            //    throw new BadRequestException("Tenant NID is not verified");

            // Check for overlapping leases
            // Only check for overlaps if end date is specified
            if (lease.EndDate.HasValue)
            {
                bool hasOverlap = await leaseRepo.AnyAsync(l =>
                    l.PropertyId == propertyId &&
                    l.IsActive &&
                    ((l.EndDate.HasValue && l.EndDate >= lease.StartDate && l.StartDate <= lease.EndDate) ||
                     (!l.EndDate.HasValue && l.StartDate <= lease.EndDate)));

                if (hasOverlap)
                    throw new ConflictException("Property already leased for this period");
            }
            else
            {
                // For open-ended leases, check if there's any active lease
                bool hasActiveLease = await leaseRepo.AnyAsync(l =>
                    l.PropertyId == propertyId &&
                    l.IsActive);

                if (hasActiveLease)
                    throw new ConflictException("Property already has an active lease");
            }

            lease.PropertyId = propertyId;
            lease.TenantId = tenant.UserId;
            lease.CreatedAt = DateTime.Now;
            // If no end date specified, lease is open-ended (EndDate remains null)

            // Update property status
            property.IsAvailable = false;
            propertyRepo.Update(property);

            await leaseRepo.AddAsync(lease);
            await _unitOfWork.SaveChangesAsync();

            // Create security deposit payment record if property has security deposit
            if (property.SecurityDeposit > 0)
            {
                try
                {
                    await _paymentService.CreateSecurityDepositPaymentAsync(lease.LeaseId, property.SecurityDeposit);
                }
                catch (Exception ex)
                {
                    // Log error but don't fail lease creation if security deposit payment creation fails
                    // This allows lease to be created even if payment service has issues
                }
            }

            return lease;
        }

        /// <summary>
        /// Terminates an active lease agreement
        /// Marks the lease as inactive and makes the property available again
        /// </summary>
        /// <param name="leaseId">ID of the lease to end</param>
        public async Task EndLeaseAsync(int leaseId)
        {
            var leaseRepo = _unitOfWork.GetRepository<Lease>();
            var propertyRepo = _unitOfWork.GetRepository<Property>();

            var lease = await leaseRepo.GetByIdAsync(leaseId);
            if (lease == null) throw new NotFoundException(nameof(Lease), leaseId);

            // Update lease - mark as inactive and set end date to now
            lease.EndDate = DateTime.Now;
            lease.IsActive = false;
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

        /// <summary>
        /// Renews an existing lease by extending the end date
        /// Validates that the new end date is after the current end date (or start date if open-ended)
        /// </summary>
        /// <param name="leaseId">ID of the lease to renew</param>
        /// <param name="newEndDate">New end date for the lease</param>
        public async Task RenewLeaseAsync(int leaseId, DateTime newEndDate)
        {
            var leaseRepo = _unitOfWork.GetRepository<Lease>();
            var lease = await leaseRepo.GetByIdAsync(leaseId);

            if (lease == null) throw new NotFoundException(nameof(Lease), leaseId);
            
            // Validate new end date
            // If lease has an end date, new date must be after it
            // If lease is open-ended (no end date), new date must be after start date
            DateTime comparisonDate = lease.EndDate ?? lease.StartDate;
            if (newEndDate <= comparisonDate)
                throw new BadHttpRequestException("New end date must be after current end date (or start date for open-ended leases)");

            lease.EndDate = newEndDate;
            leaseRepo.Update(lease);
            await _unitOfWork.SaveChangesAsync();
        }

        /// <summary>
        /// Retrieves a specific lease by its ID with all related entities
        /// Includes property, tenant, payments, and landlord information
        /// </summary>
        /// <param name="id">ID of the lease to retrieve</param>
        /// <returns>Lease entity with related data</returns>
        public async Task<Lease> GetLeaseByIdAsync(int id)
        {
            var leaseRepo = _unitOfWork.GetRepository<Lease>();
            return await leaseRepo.GetByIdAsync(
                l => l.LeaseId == id,
                l => l.Property,
                l => l.Property.Images,
                l => l.Tenant,
                l => l.RentPayments,
                l => l.Property.Landlord
            );
        }

        /// <summary>
        /// Gets all leases for a specific tenant
        /// Returns both active and inactive leases
        /// </summary>
        /// <param name="tenantId">ID of the tenant</param>
        /// <returns>Collection of leases for the tenant</returns>
        public async Task<IEnumerable<Lease>> GetLeasesByTenantAsync(int tenantId)
        {
            var leaseRepo = _unitOfWork.GetRepository<Lease>();
            return await leaseRepo.FindAsync(
                l => l.TenantId == tenantId,
                l => l.Property,
                l => l.Property.Images,
                l => l.Tenant
            );
        }

        /// <summary>
        /// Gets the currently active lease for a tenant
        /// Returns the most recent active lease if multiple exist
        /// </summary>
        /// <param name="tenantId">ID of the tenant</param>
        /// <returns>Active lease entity or null if no active lease exists</returns>
        public async Task<Lease?> GetActiveLeaseByTenantAsync(int tenantId)
        {
            var leaseRepo = _unitOfWork.GetRepository<Lease>();
            var leases = await leaseRepo.FindAsync(
                l => l.TenantId == tenantId && 
                     l.IsActive && 
                     (l.EndDate == null || l.EndDate >= DateTime.Now), // Handle nullable EndDate
                l => l.Property,
                l => l.Property.Images,
                l => l.Tenant
            );
            return leases.OrderByDescending(l => l.StartDate).FirstOrDefault();
        }

        /// <summary>
        /// Gets all leases for a specific property
        /// Useful for landlords to view lease history of their properties
        /// </summary>
        /// <param name="propertyId">ID of the property</param>
        /// <returns>Collection of leases for the property</returns>
        public async Task<IEnumerable<Lease>> GetLeasesByPropertyAsync(int propertyId)
        {
            var leaseRepo = _unitOfWork.GetRepository<Lease>();
            return await leaseRepo.FindAsync(
                l => l.PropertyId == propertyId,
                l => l.Tenant,
                l => l.Property
            );
        }

        /// <summary>
        /// Generates a PDF lease document for a specific lease
        /// Creates a formal lease agreement document and saves it to storage
        /// </summary>
        /// <param name="leaseId">ID of the lease to generate document for</param>
        /// <returns>File path of the generated PDF document</returns>
        public async Task<string> GenerateLeaseDocumentAsync(int leaseId)
        {
            var lease = await GetLeaseByIdAsync(leaseId);
            //if (lease == null) throw new KeyNotFoundException("Lease not found");
            if (lease == null) throw new NotFoundException(nameof(Lease), leaseId);

            var leaseDocumentBytes = await _pdfService.GenerateLeaseAgreementAsync(lease);

            // Convert byte[] to a base64 string or save the document to a file and return the path
            var leaseDocumentPath = $"{_baseStoragePath}\\LeaseDocuments_{leaseId}.pdf";
            await File.WriteAllBytesAsync(leaseDocumentPath, leaseDocumentBytes);

            return leaseDocumentPath;
        }
    }
}
