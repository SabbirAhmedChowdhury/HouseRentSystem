using HouseRentAPI.Interfaces;

namespace HouseRentAPI.Services
{
    public class BackgroundTaskService : BackgroundService
    {
        private readonly ILogger<BackgroundTaskService> _logger;
        private readonly IServiceProvider _serviceProvider;
        private Timer _timer;

        public BackgroundTaskService(
            ILogger<BackgroundTaskService> logger,
            IServiceProvider serviceProvider)
        {
            _logger = logger;
            _serviceProvider = serviceProvider;
        }

        protected override Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _timer = new Timer(DoDailyWork, null, TimeSpan.Zero, TimeSpan.FromDays(1));
            return Task.CompletedTask;
        }

        private async void DoDailyWork(object state)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var paymentService = scope.ServiceProvider.GetRequiredService<IPaymentService>();

                // 1. Generate monthly rent payments for all active leases
                // This runs daily to ensure payments are created for upcoming months
                var createdPayments = await paymentService.GenerateMonthlyRentPaymentsAsync();
                if (createdPayments > 0)
                {
                    _logger.LogInformation($"Generated {createdPayments} new monthly rent payment records");
                }

                // 2. Send reminders for payments due in 3 days
                var reminderDate = DateTime.Now.AddDays(3).Date;
                var payments = await paymentService.GetPaymentsByDueDateAsync(reminderDate);

                foreach (var payment in payments)
                {
                    await paymentService.SendRentReminderAsync(payment.PaymentId);
                }

                _logger.LogInformation($"Sent {payments.Count()} rent reminders for {reminderDate:yyyy-MM-dd}");

                // 3. Check for overdue payments
                var today = DateTime.Now.Date;
                var overduePayments = await paymentService.GetPaymentsByDueDateAsync(today.AddDays(-1));

                foreach (var payment in overduePayments)
                {
                    await paymentService.SendRentReminderAsync(payment.PaymentId);
                    _logger.LogWarning($"Sent overdue reminder for payment {payment.PaymentId}");
                }

                _logger.LogInformation($"Sent {overduePayments.Count()} overdue reminders");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred in background task");
            }
        }
        public override Task StopAsync(CancellationToken cancellationToken)
        {
            _timer?.Change(Timeout.Infinite, 0);
            return base.StopAsync(cancellationToken);
        }
    }
}