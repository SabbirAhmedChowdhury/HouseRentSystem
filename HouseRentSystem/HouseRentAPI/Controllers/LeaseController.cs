using AutoMapper;
using HouseRentAPI.DTOs;
using HouseRentAPI.Interfaces;
using HouseRentAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HouseRentAPI.Controllers
{
    /// <summary>
    /// Controller for managing lease operations
    /// Handles lease creation, renewal, termination, and retrieval for both landlords and tenants
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class LeaseController : ControllerBase
    {
        private readonly ILeaseService _leaseService;
        private readonly IMapper _mapper;

        public LeaseController(ILeaseService leaseService, IMapper mapper)
        {
            _leaseService = leaseService;
            _mapper = mapper;
        }

        /// <summary>
        /// Creates a new lease agreement between a landlord and tenant
        /// Requires Landlord role to create leases for their properties
        /// Tenant is identified by email address
        /// </summary>
        [HttpPost]
        [Authorize(Roles = "Landlord,Admin")]
        public async Task<ActionResult<LeaseResponseDTO>> CreateLease([FromBody] CreateLeaseDTO leaseDto)
        {
            var lease = _mapper.Map<Lease>(leaseDto);
            var createdLease = await _leaseService.CreateLeaseAsync(lease, leaseDto.PropertyId, leaseDto.TenantEmail);
            var result = _mapper.Map<LeaseResponseDTO>(createdLease);
            return CreatedAtAction(nameof(GetLeaseById), new { id = result.LeaseId }, result);
        }

        /// <summary>
        /// Terminates an active lease agreement
        /// Can be called by landlord or tenant (with proper authorization)
        /// </summary>
        [HttpPut("{id}/end")]
        public async Task<IActionResult> EndLease(int id)
        {
            await _leaseService.EndLeaseAsync(id);
            return NoContent();
        }

        /// <summary>
        /// Renews an existing lease by extending the end date
        /// Requires Landlord role to renew leases
        /// </summary>
        [HttpPut("{id}/renew")]
        [Authorize(Roles = "Landlord,Admin")]
        public async Task<IActionResult> RenewLease(int id, [FromBody] RenewLeaseDTO renewDto)
        {
            await _leaseService.RenewLeaseAsync(id, renewDto.NewEndDate);
            return NoContent();
        }

        /// <summary>
        /// Retrieves a specific lease by its ID
        /// Returns lease details including property and tenant information
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<LeaseResponseDTO>> GetLeaseById(int id)
        {
            var lease = await _leaseService.GetLeaseByIdAsync(id);
            if (lease == null) return NotFound();
            return Ok(_mapper.Map<LeaseResponseDTO>(lease));
        }

        /// <summary>
        /// Gets all leases for a specific tenant
        /// Returns both active and inactive leases
        /// </summary>
        [HttpGet("tenant/{tenantId}")]
        public async Task<ActionResult<IEnumerable<LeaseResponseDTO>>> GetLeasesByTenant(int tenantId)
        {
            var leases = await _leaseService.GetLeasesByTenantAsync(tenantId);
            return Ok(_mapper.Map<IEnumerable<LeaseResponseDTO>>(leases));
        }

        /// <summary>
        /// Gets the currently active lease for a tenant
        /// Returns the most recent active lease if multiple exist
        /// </summary>
        [HttpGet("tenant/{tenantId}/active")]
        public async Task<ActionResult<LeaseResponseDTO>> GetActiveLeaseByTenant(int tenantId)
        {
            var lease = await _leaseService.GetActiveLeaseByTenantAsync(tenantId);
            if (lease == null) return NotFound();
            return Ok(_mapper.Map<LeaseResponseDTO>(lease));
        }

        /// <summary>
        /// Gets all leases for a specific property
        /// Useful for landlords to view lease history of their properties
        /// </summary>
        [HttpGet("property/{propertyId}")]
        public async Task<ActionResult<IEnumerable<LeaseResponseDTO>>> GetLeasesByProperty(int propertyId)
        {
            var leases = await _leaseService.GetLeasesByPropertyAsync(propertyId);
            return Ok(_mapper.Map<IEnumerable<LeaseResponseDTO>>(leases));
        }

        /// <summary>
        /// Generates and downloads the lease document as a PDF
        /// Creates a formal lease agreement document for the specified lease
        /// </summary>
        [HttpGet("{id}/document")]
        public async Task<ActionResult> GenerateLeaseDocument(int id)
        {
            var documentPath = await _leaseService.GenerateLeaseDocumentAsync(id);
            var documentBytes = await System.IO.File.ReadAllBytesAsync(documentPath);

            return File(documentBytes, "application/pdf", $"Lease_{id}.pdf");
        }
    }
}
