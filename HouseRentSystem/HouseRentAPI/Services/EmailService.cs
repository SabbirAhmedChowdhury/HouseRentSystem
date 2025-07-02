using HouseRentAPI.Interfaces;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using MimeKit;
using MimeKit.Text;
using System.IO;
using System.Threading.Tasks;
using ContentDisposition = MimeKit.ContentDisposition; // Alias to resolve ambiguity
using ContentEncoding = MimeKit.ContentEncoding;       // Alias for consistency

namespace HouseRentAPI.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly IWebHostEnvironment _env;

        public EmailService(IConfiguration configuration, IWebHostEnvironment env)
        {
            _configuration = configuration;
            _env = env;
        }

        public async Task SendEmailAsync(string email, string subject, string htmlMessage)
        {
            var emailSettings = _configuration.GetSection("EmailSettings");
            var message = new MimeMessage();

            message.From.Add(new MailboxAddress(
                emailSettings["SenderName"],
                emailSettings["SenderEmail"]));

            message.To.Add(MailboxAddress.Parse(email));
            message.Subject = subject;
            message.Body = new TextPart(TextFormat.Html) { Text = htmlMessage };

            await SendEmailAsync(message);
        }

        public async Task SendEmailWithAttachmentAsync(
            string email, string subject, string htmlMessage,
            byte[] attachment, string attachmentName)
        {
            var emailSettings = _configuration.GetSection("EmailSettings");
            var message = new MimeMessage();

            message.From.Add(new MailboxAddress(
                emailSettings["SenderName"],
                emailSettings["SenderEmail"]));

            message.To.Add(MailboxAddress.Parse(email));
            message.Subject = subject;

            var body = new TextPart(TextFormat.Html) { Text = htmlMessage };

            // Create the attachment part
            var attachmentPart = new MimePart("application", "pdf")
            {
                Content = new MimeContent(new MemoryStream(attachment)),
                ContentDisposition = new ContentDisposition(ContentDisposition.Attachment),
                ContentTransferEncoding = ContentEncoding.Base64,
                FileName = attachmentName
            };

            var multipart = new Multipart("mixed");
            multipart.Add(body);
            multipart.Add(attachmentPart);

            message.Body = multipart;

            await SendEmailAsync(message);
        }

        public async Task SendTemplatedEmailAsync<T>(
            string email, string subject, string templatePath, T model)
        {
            var template = await GetEmailTemplateAsync(templatePath);
            var htmlContent = ReplaceTemplatePlaceholders(template, model);
            await SendEmailAsync(email, subject, htmlContent);
        }

        private async Task SendEmailAsync(MimeMessage message)
        {
            var emailSettings = _configuration.GetSection("EmailSettings");

            using var client = new SmtpClient();

            await client.ConnectAsync(
                emailSettings["MailServer"],
                int.Parse(emailSettings["MailPort"]),
                SecureSocketOptions.StartTls);

            await client.AuthenticateAsync(
                emailSettings["Username"],
                emailSettings["Password"]);

            await client.SendAsync(message);
            await client.DisconnectAsync(true);
        }

        private async Task<string> GetEmailTemplateAsync(string templatePath)
        {
            var fullPath = Path.Combine(_env.ContentRootPath, "EmailTemplates", templatePath);
            return await File.ReadAllTextAsync(fullPath);
        }

        private string ReplaceTemplatePlaceholders<T>(string template, T model)
        {
            foreach (var prop in typeof(T).GetProperties())
            {
                var placeholder = $"{{{{{prop.Name}}}}}";
                var value = prop.GetValue(model)?.ToString() ?? string.Empty;
                template = template.Replace(placeholder, value);
            }
            return template;
        }
    }
}