using AutoMapper;
using HouseRentAPI.DTOs;
using HouseRentAPI.Interfaces;
using HouseRentAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;


namespace HouseRentAPI.Controllers
{
    [Route("api/payments")]
    [ApiController]
    [Authorize]
    public class PaymentController : ControllerBase
    {
        private readonly IPaymentService _paymentService;
        private readonly IMapper _mapper;

        public PaymentController(IPaymentService paymentService, IMapper mapper)
        {
            _paymentService = paymentService;
            _mapper = mapper;
        }

        [HttpPost]
        public async Task<ActionResult<PaymentResponseDTO>> CreatePaymentRecord(
            [FromBody] CreatePaymentRecordDTO paymentDto)
        {
            var payment = _mapper.Map<RentPayment>(paymentDto);
            var createdPayment = await _paymentService.CreatePaymentRecordAsync(
                paymentDto.LeaseId, paymentDto.Amount, paymentDto.DueDate);

            var result = _mapper.Map<PaymentResponseDTO>(createdPayment);
            return CreatedAtAction(nameof(GetPaymentById), new { id = result.PaymentId }, result);
        }

        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdatePaymentStatus(
            int id,
            [FromBody] UpdatePaymentStatusDTO statusDto)
        {
            await _paymentService.UpdatePaymentStatusAsync(id, statusDto.Status);
            return NoContent();
        }

        [HttpPost("{id}/slip")]
        public async Task<IActionResult> UploadPaymentSlip(
            int id,
            [Required] IFormFile slipFile)
        {
            await _paymentService.UploadPaymentSlipAsync(id, slipFile);
            return NoContent();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<PaymentResponseDTO>> GetPaymentById(int id)
        {
            var payment = await _paymentService.GetPaymentAsync(id);
            if (payment == null) return NotFound();

            var result = _mapper.Map<PaymentResponseDTO>(payment);
            return Ok(result);
        }

        [HttpGet("lease/{leaseId}")]
        public async Task<ActionResult<IEnumerable<PaymentResponseDTO>>> GetPaymentsByLease(int leaseId)
        {
            var payments = await _paymentService.GetPaymentsByLeaseAsync(leaseId);
            return Ok(_mapper.Map<IEnumerable<PaymentResponseDTO>>(payments));
        }

        [HttpGet("overdue")]
        [Authorize(Roles = "Admin,Landlord")]
        public async Task<ActionResult<IEnumerable<PaymentResponseDTO>>> GetOverduePayments()
        {
            var payments = await _paymentService.GetOverduePaymentsAsync();
            return Ok(_mapper.Map<IEnumerable<PaymentResponseDTO>>(payments));
        }

        [HttpGet("tenant/{tenantId}/history")]
        public async Task<ActionResult<IEnumerable<PaymentHistoryResponseDTO>>> GetPaymentHistoryByTenant(int tenantId)
        {
            var payments = await _paymentService.GetPaymentHistoryAsync(tenantId);
            return Ok(_mapper.Map<IEnumerable<PaymentHistoryResponseDTO>>(payments));
        }

        [HttpGet("{id}/late-fee")]
        public async Task<ActionResult<LateFeeResponseDTO>> CalculateLateFee(int id)
        {
            var lateFee = await _paymentService.CalculateLateFeeAsync(id);
            return Ok(new LateFeeResponseDTO { PaymentId = id, LateFee = lateFee });
        }

        [HttpPost("{id}/verify")]
        [Authorize(Roles = "Admin,Landlord")]
        public async Task<IActionResult> VerifyPayment(int id)
        {
            await _paymentService.VerifyPaymentAsync(id);
            return NoContent();
        }

        [HttpGet("due/{dueDate}")]
        [Authorize(Roles = "Admin,Landlord")]
        public async Task<ActionResult<IEnumerable<PaymentResponseDTO>>> GetPaymentsByDueDate(DateTime dueDate)
        {
            var payments = await _paymentService.GetPaymentsByDueDateAsync(dueDate);
            return Ok(_mapper.Map<IEnumerable<PaymentResponseDTO>>(payments));
        }
    }
}
