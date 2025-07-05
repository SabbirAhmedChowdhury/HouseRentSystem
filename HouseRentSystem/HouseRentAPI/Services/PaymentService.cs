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

        public async Task<RentPayment> CreatePaymentRecordAsync(int leaseId, decimal amount, DateTime dueDate)
        {
            var paymentRepo = _unitOfWork.GetRepository<RentPayment>();
            var leaseRepo = _unitOfWork.GetRepository<Lease>();

            var lease = await leaseRepo.GetByIdAsync(leaseId);
            if (lease == null) throw new KeyNotFoundException("Lease not found");

            var payment = new RentPayment
            {
                LeaseId = leaseId,
                DueDate = dueDate,
                AmountPaid = amount,
                Status = PaymentStatus.Pending,
                CreatedAt = DateTime.Now,
                PaymentMethod = "Unspecified"
            };

            await paymentRepo.AddAsync(payment);
            await _unitOfWork.SaveChangesAsync();

            // Schedule reminder 3 days before due date
            ScheduleReminder(payment.PaymentId, dueDate.AddDays(-3));

            return payment;
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

            if (payment == null) throw new KeyNotFoundException("Payment record not found");

            var slipPath = await _fileStorageService.SaveDocumentAsync(slipFile);
            payment.PaymentSlipPath = slipPath;

            paymentRepo.Update(payment);
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
                throw new InvalidOperationException("Payment not completed");

            if (string.IsNullOrEmpty(payment.PaymentSlipPath))
                throw new InvalidOperationException("Payment slip not uploaded");

            // Additional verification logic
        }

        public async Task<decimal> CalculateLateFeeAsync(int paymentId)
        {
            var payment = await GetPaymentAsync(paymentId);
            if (payment.Status == PaymentStatus.Paid) return 0;

            var daysLate = (DateTime.Now - payment.DueDate).Days;
            return daysLate > 0 ? daysLate * 500 : 0; // 500 BDT per day late
        }

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
                throw new KeyNotFoundException($"Payment with ID {paymentId} not found");

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
    }
}