namespace HouseRentAPI.Interfaces
{
    public interface IEmailService
    {
        Task SendEmailAsync(string email, string subject, string htmlMessage);
        Task SendEmailWithAttachmentAsync(string email, string subject, string htmlMessage, byte[] attachment, string attachmentName);
        Task SendTemplatedEmailAsync<T>(string email, string subject, string templatePath, T model);
    }
}
