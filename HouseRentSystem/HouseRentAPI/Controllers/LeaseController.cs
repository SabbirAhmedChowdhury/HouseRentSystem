using AutoMapper;
using HouseRentAPI.DTOs;
using HouseRentAPI.Interfaces;
using HouseRentAPI.Models;
using Microsoft.AspNetCore.Mvc;

namespace HouseRentAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class LeaseController : ControllerBase
    {
        private readonly ILeaseService _leaseService;
        private readonly IMapper _mapper;

        public LeaseController(ILeaseService leaseService, IMapper mapper)
        {
            _leaseService = leaseService;
            _mapper = mapper;
        }

        [HttpPost]
        public async Task<ActionResult<LeaseResponseDTO>> CreateLease([FromBody] CreateLeaseDTO leaseDto)
        {
            var lease = _mapper.Map<Lease>(leaseDto);
            var createdLease = await _leaseService.CreateLeaseAsync(lease, leaseDto.PropertyId, leaseDto.TenantId);
            var result = _mapper.Map<LeaseResponseDTO>(createdLease);
            return CreatedAtAction(nameof(GetLeaseById), new { id = result.LeaseId }, result);
        }

        [HttpPut("{id}/end")]
        public async Task<IActionResult> EndLease(int id)
        {
            await _leaseService.EndLeaseAsync(id);
            return NoContent();
        }

        [HttpPut("{id}/renew")]
        public async Task<IActionResult> RenewLease(int id, [FromBody] RenewLeaseDTO renewDto)
        {
            await _leaseService.RenewLeaseAsync(id, renewDto.NewEndDate);
            return NoContent();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<LeaseResponseDTO>> GetLeaseById(int id)
        {
            var lease = await _leaseService.GetLeaseByIdAsync(id);
            if (lease == null) return NotFound();
            return _mapper.Map<LeaseResponseDTO>(lease);
        }

        [HttpGet("tenant/{tenantId}")]
        public async Task<ActionResult<IEnumerable<LeaseResponseDTO>>> GetLeasesByTenant(int tenantId)
        {
            var leases = await _leaseService.GetLeasesByTenantAsync(tenantId);
            return Ok(_mapper.Map<IEnumerable<LeaseResponseDTO>>(leases));
        }

        [HttpGet("property/{propertyId}")]
        public async Task<ActionResult<IEnumerable<LeaseResponseDTO>>> GetLeasesByProperty(int propertyId)
        {
            var leases = await _leaseService.GetLeasesByPropertyAsync(propertyId);
            return Ok(_mapper.Map<IEnumerable<LeaseResponseDTO>>(leases));
        }

        [HttpGet("{id}/document")]
        public async Task<ActionResult> GenerateLeaseDocument(int id)
        {
            var documentPath = await _leaseService.GenerateLeaseDocumentAsync(id);
            var documentBytes = await System.IO.File.ReadAllBytesAsync(documentPath);

            return File(documentBytes, "application/pdf", $"Lease_{id}.pdf");
        }
    }
}
