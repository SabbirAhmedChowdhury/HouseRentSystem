using HouseRentAPI.Interfaces;
using HouseRentAPI.Models;
using iText.Html2pdf;
using iText.IO.Font.Constants;
using iText.Kernel.Colors;
using iText.Kernel.Font;
using iText.Kernel.Geom;
using iText.Kernel.Pdf;
using iText.Kernel.Pdf.Canvas;
using iText.Kernel.Pdf.Canvas.Draw;
using iText.Layout;
using iText.Layout.Borders;
using iText.Layout.Element;
using iText.Layout.Properties;

namespace HouseRentAPI.Services
{
    public class PdfService : IPdfService
    {
        private readonly PdfFont _regularFont;
        private readonly PdfFont _boldFont;

        public PdfService()
        {
            // Create regular and bold fonts
            _regularFont = PdfFontFactory.CreateFont(StandardFonts.HELVETICA);
            _boldFont = PdfFontFactory.CreateFont(StandardFonts.HELVETICA_BOLD);
        }

        public async Task<byte[]> GenerateLeaseAgreementAsync(Lease lease)
        {
            using var stream = new MemoryStream();
            using var writer = new PdfWriter(stream);
            using var pdf = new PdfDocument(writer);
            using var document = new Document(pdf, PageSize.A4);

            // Set document margins
            document.SetMargins(50, 50, 50, 50);

            // Add title with proper styling
            var title = new Paragraph("LEASE AGREEMENT")
                .SetTextAlignment(TextAlignment.CENTER)
                .SetFont(_boldFont)  // Use bold font
                .SetFontSize(18);
            document.Add(title);

            // Add spacing
            document.Add(new Paragraph("\n"));

            // Add parties section
            document.Add(new Paragraph($"This Lease Agreement is made on {lease.StartDate:dd MMMM yyyy} between:")
                .SetFont(_regularFont));

            // Landlord section
            document.Add(CreateSectionHeader("LANDLORD:"));
            document.Add(CreateSectionText($"{lease.Property.Landlord.FullName}"));
            document.Add(CreateSectionText($"NID: {lease.Property.Landlord.NID}"));
            document.Add(CreateSectionText($"Address: {lease.Property.Address}"));

            // Tenant section
            document.Add(CreateSectionHeader("TENANT:"));
            document.Add(CreateSectionText($"{lease.Tenant.FullName}"));
            document.Add(CreateSectionText($"NID: {lease.Tenant.NID}"));
            document.Add(CreateSectionText($"Phone: {lease.Tenant.PhoneNumber}"));

            // Property details
            document.Add(CreateSectionHeader("PROPERTY DETAILS:"));
            document.Add(CreateSectionText($"Address: {lease.Property.Address}"));
            document.Add(CreateSectionText($"Rent Amount: {lease.MonthlyRent} BDT per month"));
            document.Add(CreateSectionText($"Security Deposit: {lease.Property.SecurityDeposit} BDT"));
            document.Add(CreateSectionText($"Lease Term: {lease.StartDate:dd MMM yyyy} to {lease.EndDate:dd MMM yyyy}"));

            // Terms and conditions
            document.Add(CreateSectionHeader("TERMS AND CONDITIONS:"));
            document.Add(new Paragraph(lease.TermsAndConditions ?? GetDefaultTerms())
                .SetFont(_regularFont)
                .SetMarginBottom(20));

            // Signatures (on new page)
            document.Add(new AreaBreak(AreaBreakType.NEXT_PAGE));

            var signatureTable = new Table(new float[] { 1, 1 })
                .SetWidth(UnitValue.CreatePercentValue(100));

            // Landlord signature
            signatureTable.AddCell(new Cell()
                .Add(new Paragraph("___________________________")
                .SetTextAlignment(TextAlignment.CENTER))
                .SetBorder(Border.NO_BORDER));

            signatureTable.AddCell(new Cell()
                .Add(new Paragraph("___________________________")
                .SetTextAlignment(TextAlignment.CENTER))
                .SetBorder(Border.NO_BORDER));

            signatureTable.AddCell(new Cell()
                .Add(new Paragraph("Landlord Signature")
                .SetTextAlignment(TextAlignment.CENTER)
                .SetFont(_regularFont))
                .SetBorder(Border.NO_BORDER));

            signatureTable.AddCell(new Cell()
                .Add(new Paragraph("Tenant Signature")
                .SetTextAlignment(TextAlignment.CENTER)
                .SetFont(_regularFont))
                .SetBorder(Border.NO_BORDER));

            signatureTable.AddCell(new Cell()
                .Add(new Paragraph($"Date: {DateTime.Today:dd MMM yyyy}")
                .SetTextAlignment(TextAlignment.CENTER)
                .SetFont(_regularFont))
                .SetBorder(Border.NO_BORDER));
                //.SetColSpan(2);

            document.Add(signatureTable);

            document.Close();
            return stream.ToArray();
        }

        public async Task<byte[]> GenerateRentReceiptAsync(RentPayment payment)
        {
            using var stream = new MemoryStream();
            using var writer = new PdfWriter(stream);
            using var pdf = new PdfDocument(writer);
            using var document = new Document(pdf, PageSize.A4);

            // Header
            var header = new Paragraph("RENT PAYMENT RECEIPT")
                .SetTextAlignment(TextAlignment.CENTER)
                .SetFont(_boldFont)
                .SetFontSize(16);
            document.Add(header);

            document.Add(new Paragraph($"Receipt No: {payment.PaymentId}")
                .SetTextAlignment(TextAlignment.CENTER)
                .SetFont(_regularFont));
            document.Add(new Paragraph($"Date: {DateTime.Now:dd MMM yyyy}")
                .SetTextAlignment(TextAlignment.CENTER)
                .SetFont(_regularFont));

            // Divider line
            document.Add(new LineSeparator(new SolidLine(1f)));
            document.Add(new Paragraph("\n"));

            // Payment details table
            var table = new Table(2)
                .SetWidth(UnitValue.CreatePercentValue(100))
                .SetMarginBottom(20);

            AddTableHeaderRow(table, "Property Address", payment.Lease.Property.Address);
            AddTableHeaderRow(table, "Tenant Name", payment.Lease.Tenant.FullName);
            AddTableHeaderRow(table, "Payment Date", payment.PaymentDate?.ToString("dd MMM yyyy") ?? "N/A");
            AddTableHeaderRow(table, "Amount Paid", $"{payment.AmountPaid} BDT");
            AddTableHeaderRow(table, "Payment Method", payment.PaymentMethod ?? "Bank Transfer");
            AddTableHeaderRow(table, "Payment Period", $"{payment.Lease.StartDate:dd MMM yy} - {payment.Lease.EndDate:dd MMM yy}");

            document.Add(table);

            // Footer
            document.Add(new Paragraph("\n\n"));
            document.Add(new Paragraph("___________________________")
                .SetTextAlignment(TextAlignment.CENTER)
                .SetFont(_regularFont));
            document.Add(new Paragraph("Authorized Signature")
                .SetTextAlignment(TextAlignment.CENTER)
                .SetFont(_regularFont));
            document.Add(new Paragraph("House Rent Management System")
                .SetTextAlignment(TextAlignment.CENTER)
                .SetFont(_regularFont));

            document.Close();
            return stream.ToArray();
        }

        public async Task<byte[]> GenerateFromHtmlAsync(string htmlContent)
        {
            using var stream = new MemoryStream();
            using var writer = new PdfWriter(stream);

            var converterProperties = new ConverterProperties();
            HtmlConverter.ConvertToPdf(htmlContent, writer, converterProperties);

            return stream.ToArray();
        }

        // Helper methods
        private Paragraph CreateSectionHeader(string text)
        {
            return new Paragraph(text)
                .SetFont(_boldFont)
                .SetMarginTop(10)
                .SetMarginBottom(5);
        }

        private Paragraph CreateSectionText(string text)
        {
            return new Paragraph(text)
                .SetFont(_regularFont)
                .SetMarginBottom(3);
        }

        private void AddTableHeaderRow(Table table, string header, string value)
        {
            table.AddCell(new Cell()
                .Add(new Paragraph(header))
                .SetFont(_boldFont)
                .SetBackgroundColor(ColorConstants.LIGHT_GRAY)
                .SetPadding(5));

            table.AddCell(new Cell()
                .Add(new Paragraph(value))
                .SetFont(_regularFont)
                .SetPadding(5));
        }

        private string GetDefaultTerms()
        {
            return @"1. The tenant shall pay rent monthly in advance.
2. The tenant shall not make alterations to the property without written consent.
3. The landlord shall be responsible for structural repairs.
4. Either party may terminate this agreement with 30 days written notice.
5. The security deposit shall be refunded within 15 days after termination, minus any deductions for damages.";
        }

        public Task<byte[]> GenerateMaintenanceReportAsync(int propertyId)
        {
            throw new NotImplementedException();
        }

        public Task<byte[]> GenerateFinancialReportAsync(int landlordId, DateTime startDate, DateTime endDate)
        {
            throw new NotImplementedException();
        }

        public void AddWatermark(PdfDocument pdfDoc, string text)
        {
            for (int i = 1; i <= pdfDoc.GetNumberOfPages(); i++)
            {
                var page = pdfDoc.GetPage(i);
                var canvas = new PdfCanvas(page.NewContentStreamBefore(), page.GetResources(), pdfDoc);

                // Create a Paragraph for the watermark text
                var watermarkParagraph = new Paragraph(text)
                    .SetFontColor(ColorConstants.LIGHT_GRAY)
                    .SetFontSize(60)
                    .SetTextAlignment(TextAlignment.CENTER);

                new Canvas(canvas, page.GetPageSize())
                    .Add(watermarkParagraph)
                    .ShowTextAligned(watermarkParagraph,
                        page.GetPageSize().GetWidth() / 2,
                        page.GetPageSize().GetHeight() / 2,
                        i,
                        TextAlignment.CENTER,
                        VerticalAlignment.MIDDLE,
                        45);
            }
        }

        public void AddPageNumbers(PdfDocument pdfDoc)
        {
            for (int i = 1; i <= pdfDoc.GetNumberOfPages(); i++)
            {
                var page = pdfDoc.GetPage(i);
                var canvas = new PdfCanvas(page.NewContentStreamAfter(), page.GetResources(), pdfDoc);

                new Canvas(canvas, page.GetPageSize())
                    .SetFontSize(10)
                    .ShowTextAligned($"Page {i} of {pdfDoc.GetNumberOfPages()}",
                        page.GetPageSize().GetWidth() / 2,
                        30, // Position from bottom
                        TextAlignment.CENTER);
            }
        }

        public void AddHeaderFooter(PdfDocument pdfDoc)
        {
            var header = new Paragraph("House Rent Management System")
                .SetFont(_boldFont)
                .SetFontSize(12)
                .SetTextAlignment(TextAlignment.CENTER);

            var footer = new Paragraph("Confidential Document")
                .SetFont(_regularFont)
                .SetFontSize(8)
                .SetTextAlignment(TextAlignment.CENTER);

            for (int i = 1; i <= pdfDoc.GetNumberOfPages(); i++)
            {
                var page = pdfDoc.GetPage(i);

                // Header
                new Canvas(new PdfCanvas(page), page.GetPageSize())
                    .ShowTextAligned(header,
                        page.GetPageSize().GetWidth() / 2,
                        page.GetPageSize().GetHeight() - 30,
                        TextAlignment.CENTER);

                // Footer
                new Canvas(new PdfCanvas(page), page.GetPageSize())
                    .ShowTextAligned(footer,
                        page.GetPageSize().GetWidth() / 2,
                        30,
                        TextAlignment.CENTER);
            }
        }
    }
}