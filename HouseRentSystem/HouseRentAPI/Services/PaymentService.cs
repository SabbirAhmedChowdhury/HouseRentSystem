using HouseRentAPI.Enums;
using HouseRentAPI.Exceptions;
using HouseRentAPI.Interfaces;
using HouseRentAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace HouseRentAPI.Services
{
    public class PaymentService : IPaymentService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IFileStorageService _fileStorageService;
        private readonly IEmailService _emailService;
        private readonly IServiceProvider _serviceProvider;

        public PaymentService(
            IUnitOfWork unitOfWork,
            IFileStorageService fileStorageService,
            IEmailService emailService,
            IServiceProvider serviceProvider)
        {
            _unitOfWork = unitOfWork;
            _fileStorageService = fileStorageService;
            _emailService = emailService;
            _serviceProvider = serviceProvider;
        }

        /// <summary>
        /// Creates a payment record (rent or security deposit)
        /// </summary>
        /// <param name="leaseId">ID of the lease</param>
        /// <param name="amount">Payment amount</param>
        /// <param name="dueDate">Due date for the payment</param>
        /// <param name="paymentType">Type of payment (Rent or SecurityDeposit)</param>
        /// <returns>Created payment record</returns>
        public async Task<RentPayment> CreatePaymentRecordAsync(int leaseId, decimal amount, DateTime dueDate, PaymentType paymentType = PaymentType.Rent)
        {
            var paymentRepo = _unitOfWork.GetRepository<RentPayment>();
            var leaseRepo = _unitOfWork.GetRepository<Lease>();

            var lease = await leaseRepo.GetByIdAsync(leaseId);
            if (lease == null) throw new NotFoundException(nameof(Lease), leaseId);

            var payment = new RentPayment
            {
                LeaseId = leaseId,
                DueDate = dueDate,
                AmountPaid = amount,
                Status = PaymentStatus.Pending,
                PaymentType = paymentType,
                CreatedAt = DateTime.Now,
                PaymentMethod = "Unspecified"
            };

            await paymentRepo.AddAsync(payment);
            await _unitOfWork.SaveChangesAsync();

            // Schedule reminder 3 days before due date (only for rent payments)
            if (paymentType == PaymentType.Rent)
            {
                ScheduleReminder(payment.PaymentId, dueDate.AddDays(-3));
            }

            return payment;
        }
        
        /// <summary>
        /// Creates a security deposit payment record when a lease is created
        /// Security deposit is typically due on the lease start date
        /// </summary>
        /// <param name="leaseId">ID of the lease</param>
        /// <param name="amount">Security deposit amount</param>
        /// <returns>Created security deposit payment record</returns>
        public async Task<RentPayment> CreateSecurityDepositPaymentAsync(int leaseId, decimal amount)
        {
            var leaseRepo = _unitOfWork.GetRepository<Lease>();
            var lease = await leaseRepo.GetByIdAsync(leaseId);
            
            if (lease == null) throw new NotFoundException(nameof(Lease), leaseId);
            
            // Security deposit is due on the lease start date
            return await CreatePaymentRecordAsync(leaseId, amount, lease.StartDate, PaymentType.SecurityDeposit);
        }

        public async Task UpdatePaymentStatusAsync(int paymentId, PaymentStatus status)
        {
            var paymentRepo = _unitOfWork.GetRepository<RentPayment>();
            var payment = await paymentRepo.GetByIdAsync(paymentId);

            //if (payment == null) throw new KeyNotFoundException("Payment record not found");
            if (payment == null) throw new NotFoundException(nameof(RentPayment), paymentId);

            // Validate status transition
            if (payment.Status == PaymentStatus.Paid && status != PaymentStatus.Paid)
            {
                throw new BadRequestException(
                    "Cannot change status of completed payment",
                    "Payment has already been marked as paid");
            }


            payment.Status = status;

            // Update payment date if status is changed to Paid
            if (status == PaymentStatus.Paid)
            {
                payment.PaymentDate = DateTime.Now;

                // Send payment confirmation
                await SendPaymentConfirmationAsync(paymentId);
            }

            paymentRepo.Update(payment);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task UploadPaymentSlipAsync(int paymentId, IFormFile slipFile)
        {
            var paymentRepo = _unitOfWork.GetRepository<RentPayment>();
            var payment = await paymentRepo.GetByIdAsync(paymentId);

            //if (payment == null) throw new KeyNotFoundException("Payment record not found");
            if (payment == null) throw new NotFoundException(nameof(RentPayment), paymentId);

            var slipPath = await _fileStorageService.SaveDocumentAsync(slipFile);
            payment.PaymentSlipPath = slipPath;

            paymentRepo.Update(payment);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task DeleteUnpaidPaymentAsync(int paymentId)
        {
            var paymentRepo = _unitOfWork.GetRepository<RentPayment>();
            var payment = await paymentRepo.GetByIdAsync(paymentId);

            if (payment == null)
                throw new NotFoundException(nameof(RentPayment), paymentId);

            if (payment.Status == PaymentStatus.Paid)
            {
                throw new BadRequestException(
                    "Cannot delete paid payments",
                    "Only unpaid payments can be deleted");
            }

            paymentRepo.Remove(payment);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task<IEnumerable<RentPayment>> GetPaymentsByLeaseAsync(int leaseId)
        {
            var paymentRepo = _unitOfWork.GetRepository<RentPayment>();
            return await paymentRepo.FindAsync(p => p.LeaseId == leaseId);
        }

        public async Task<IEnumerable<RentPayment>> GetOverduePaymentsAsync()
        {
            var paymentRepo = _unitOfWork.GetRepository<RentPayment>();
            return await paymentRepo.FindAsync(p =>
                p.Status == PaymentStatus.Pending &&
                p.DueDate < DateTime.Now
            );
        }

        public async Task SendRentReminderAsync(int paymentId)
        {
            var paymentRepo = _unitOfWork.GetRepository<RentPayment>();
            var payment = await paymentRepo.FirstOrDefaultAsync(
                p => p.PaymentId == paymentId,
                p => p.Lease,
                p => p.Lease.Tenant,
                p => p.Lease.Property
            );

            if (payment == null) return;

            var subject = "Rent Payment Reminder";
            var body = $"Dear {payment.Lease.Tenant.FullName},<br/><br/>" +
                      $"This is a reminder that your rent payment for " +
                      $"{payment.Lease.Property.Address} of {payment.AmountPaid} BDT " +
                      $"is due on {payment.DueDate:dd MMM yyyy}.<br/>" +
                      "Please make the payment at your earliest convenience.<br/><br/>" +
                      "Best regards,<br/>House Rent Management System";

            await _emailService.SendEmailAsync(payment.Lease.Tenant.Email, subject, body);
        }

        private async Task SendPaymentConfirmationAsync(int paymentId)
        {
            var paymentRepo = _unitOfWork.GetRepository<RentPayment>();
            var payment = await paymentRepo.FirstOrDefaultAsync(
                p => p.PaymentId == paymentId,
                p => p.Lease,
                p => p.Lease.Tenant,
                p => p.Lease.Property
            );

            if (payment == null) return;

            var subject = "Rent Payment Confirmation";
            var body = $"Dear {payment.Lease.Tenant.FullName},<br/><br/>" +
                      $"We've received your rent payment of {payment.AmountPaid} BDT " +
                      $"for {payment.Lease.Property.Address} on {payment.PaymentDate:dd MMM yyyy}.<br/>" +
                      "Thank you for your payment!<br/><br/>" +
                      "Best regards,<br/>House Rent Management System";

            await _emailService.SendEmailAsync(payment.Lease.Tenant.Email, subject, body);
        }

        private void ScheduleReminder(int paymentId, DateTime reminderDate)
        {
            var delay = reminderDate - DateTime.Now;
            if (delay <= TimeSpan.Zero) return;

            Task.Delay(delay).ContinueWith(async _ =>
            {
                using var scope = _serviceProvider.CreateScope();
                var paymentService = scope.ServiceProvider.GetRequiredService<IPaymentService>();
                await paymentService.SendRentReminderAsync(paymentId);
            });
        }

        public async Task VerifyPaymentAsync(int paymentId)
        {
            var payment = await GetPaymentAsync(paymentId);

            if (payment.Status != PaymentStatus.Paid)
                //throw new InvalidOperationException("Payment not completed");
                throw new BadRequestException("Payment not completed");

            if (string.IsNullOrEmpty(payment.PaymentSlipPath))
                //throw new InvalidOperationException("Payment slip not uploaded");
                throw new BadRequestException("Payment not completed");

            // Additional verification logic
        }

        //public async Task<decimal> CalculateLateFeeAsync(int paymentId)
        //{
        //    var payment = await GetPaymentAsync(paymentId);
        //    if (payment.Status == PaymentStatus.Paid) return 0;

        //    var daysLate = (DateTime.Now - payment.DueDate).Days;
        //    return daysLate > 0 ? daysLate * 500 : 0; // 500 BDT per day late
        //}

        public async Task<IEnumerable<RentPayment>> GetPaymentHistoryAsync(int tenantId)
        {
            var paymentRepo = _unitOfWork.GetRepository<RentPayment>();
            return await paymentRepo.FindAsync(
                p => p.Lease.TenantId == tenantId,
                p => p.Lease,
                p => p.Lease.Property
            );
        }

        public async Task<RentPayment> GetPaymentAsync(int paymentId)
        {
            var paymentRepo = _unitOfWork.GetRepository<RentPayment>();

            var payment = await paymentRepo.FirstOrDefaultAsync(
                predicate: p => p.PaymentId == paymentId,
                include: query => query
                    .Include(p => p.Lease) // Correct usage of Include
                        .ThenInclude(l => l.Property)
                            .ThenInclude(p => p.Images)
                    .Include(p => p.Lease)
                        .ThenInclude(l => l.Property)
                            .ThenInclude(p => p.Landlord)
                    .Include(p => p.Lease)
                        .ThenInclude(l => l.Tenant)
            );

            if (payment == null)
                //throw new KeyNotFoundException($"Payment with ID {paymentId} not found");
                throw new NotFoundException(nameof(RentPayment), paymentId);

            return payment;
        }

        public async Task<IEnumerable<RentPayment>> GetPaymentsByDueDateAsync(DateTime dueDate)
        {
            var paymentRepo = _unitOfWork.GetRepository<RentPayment>();

            return await paymentRepo.FindAsync(
                p => p.DueDate.Date == dueDate.Date && p.Status == PaymentStatus.Pending,
                query => query
                    .Include(p => p.Lease)
                        .ThenInclude(l => l.Tenant)
                    .Include(p => p.Lease)
                        .ThenInclude(l => l.Property)
            );
        }

        /// <summary>
        /// Gets all payments for properties owned by a specific landlord
        /// Includes lease, tenant, and property information
        /// </summary>
        /// <param name="landlordId">ID of the landlord</param>
        /// <returns>Collection of payments for the landlord's properties</returns>
        public async Task<IEnumerable<RentPayment>> GetPaymentsByLandlordAsync(int landlordId)
        {
            var paymentRepo = _unitOfWork.GetRepository<RentPayment>();

            // First, get all payments with includes, then filter by landlord
            var allPayments = await paymentRepo.FindAsync(
                p => true, // Get all payments first
                query => query
                    .Include(p => p.Lease)
                        .ThenInclude(l => l.Tenant)
                    .Include(p => p.Lease)
                        .ThenInclude(l => l.Property)
                            .ThenInclude(prop => prop.Landlord)
            );

            // Filter by landlord ID after loading related data
            return allPayments.Where(p => p.Lease?.Property?.LandlordId == landlordId);
        }

        /// <summary>
        /// Gets all pending payments for a specific tenant
        /// Returns payments with Pending status for the tenant's leases
        /// </summary>
        /// <param name="tenantId">ID of the tenant</param>
        /// <returns>Collection of pending payments for the tenant</returns>
        public async Task<IEnumerable<RentPayment>> GetPendingPaymentsByTenantAsync(int tenantId)
        {
            var paymentRepo = _unitOfWork.GetRepository<RentPayment>();

            // Get all pending payments with includes, then filter by tenant
            var pendingPayments = await paymentRepo.FindAsync(
                p => p.Status == PaymentStatus.Pending,
                query => query
                    .Include(p => p.Lease)
                        .ThenInclude(l => l.Tenant)
                    .Include(p => p.Lease)
                        .ThenInclude(l => l.Property)
            );

            // Filter by tenant ID after loading related data
            return pendingPayments.Where(p => p.Lease?.TenantId == tenantId);
        }

        /// <summary>
        /// Generates monthly rent payment records for all active leases
        /// Checks for existing payments and creates new ones for upcoming months
        /// This method should be called by a background service daily or monthly
        /// </summary>
        /// <returns>Number of payment records created</returns>
        public async Task<int> GenerateMonthlyRentPaymentsAsync()
        {
            var leaseRepo = _unitOfWork.GetRepository<Lease>();
            var paymentRepo = _unitOfWork.GetRepository<RentPayment>();
            
            // Get all active leases with their property information
            var activeLeases = await leaseRepo.FindAsync(
                l => l.IsActive,
                l => l.Property
            );
            
            int createdCount = 0;
            var now = DateTime.Now;
            var nextMonth = new DateTime(now.Year, now.Month, 1).AddMonths(1);
            
            foreach (var lease in activeLeases)
            {
                // Skip if lease hasn't started yet
                if (lease.StartDate > nextMonth)
                    continue;
                
                // Skip if lease has ended (for leases with end dates)
                if (lease.EndDate.HasValue && lease.EndDate.Value < nextMonth)
                    continue;
                
                // Check if payment for next month already exists
                var existingPayment = await paymentRepo.FirstOrDefaultAsync(
                    p => p.LeaseId == lease.LeaseId &&
                         p.PaymentType == PaymentType.Rent &&
                         p.DueDate.Year == nextMonth.Year &&
                         p.DueDate.Month == nextMonth.Month
                );
                
                // Create payment if it doesn't exist
                if (existingPayment == null)
                {
                    // Set due date to the 1st of next month
                    var dueDate = new DateTime(nextMonth.Year, nextMonth.Month, 1);
                    
                    await CreatePaymentRecordAsync(
                        lease.LeaseId,
                        lease.MonthlyRent,
                        dueDate,
                        PaymentType.Rent
                    );
                    createdCount++;
                }
            }
            
            return createdCount;
        }

        /// <summary>
        /// Generates monthly rent payment for a specific active lease
        /// Creates payment for the next month if it doesn't exist
        /// </summary>
        /// <param name="leaseId">ID of the lease</param>
        /// <returns>Created payment record or null if no payment was needed</returns>
        public async Task<RentPayment?> GenerateRentPaymentForLeaseAsync(int leaseId)
        {
            var leaseRepo = _unitOfWork.GetRepository<Lease>();
            var paymentRepo = _unitOfWork.GetRepository<RentPayment>();
            
            var lease = await leaseRepo.GetByIdAsync(l => l.LeaseId == leaseId, l => l.Property);
            if (lease == null || !lease.IsActive)
                return null;
            
            var now = DateTime.Now;
            var nextMonth = new DateTime(now.Year, now.Month, 1).AddMonths(1);
            
            // Skip if lease hasn't started yet
            if (lease.StartDate > nextMonth)
                return null;
            
            // Skip if lease has ended
            if (lease.EndDate.HasValue && lease.EndDate.Value < nextMonth)
                return null;
            
            // Check if payment for next month already exists
            var existingPayment = await paymentRepo.FirstOrDefaultAsync(
                p => p.LeaseId == leaseId &&
                     p.PaymentType == PaymentType.Rent &&
                     p.DueDate.Year == nextMonth.Year &&
                     p.DueDate.Month == nextMonth.Month
            );
            
            if (existingPayment != null)
                return null;
            
            // Create payment for next month
            var dueDate = new DateTime(nextMonth.Year, nextMonth.Month, 1);
            return await CreatePaymentRecordAsync(
                leaseId,
                lease.MonthlyRent,
                dueDate,
                PaymentType.Rent
            );
        }
    }
}