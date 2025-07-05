using AutoMapper;
using HouseRentAPI.DTOs;
using HouseRentAPI.Interfaces;
using HouseRentAPI.Models;
using Microsoft.AspNetCore.Mvc;


namespace HouseRentAPI.Controllers
{
    [Route("api/maintenance")]
    [ApiController]
    public class MaintenanceRequestController : ControllerBase
    {
        private readonly IMaintenanceService _maintenanceService;
        private readonly IMapper _mapper;

        public MaintenanceRequestController(IMaintenanceService maintenanceService, IMapper mapper)
        {
            _maintenanceService = maintenanceService;
            _mapper = mapper;
        }

        [HttpPost]
        public async Task<ActionResult<MaintenanceResponseDTO>> CreateRequest(
            [FromBody] CreateMaintenanceRequestDTO requestDto)
        {
            var request = _mapper.Map<MaintenanceRequest>(requestDto);
            var createdRequest = await _maintenanceService.CreateRequestAsync(request);
            var result = _mapper.Map<MaintenanceResponseDTO>(createdRequest);
            return CreatedAtAction(nameof(GetRequestById), new { id = result.RequestId }, result);
        }

        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateRequestStatus(
            int id,
            [FromBody] UpdateMaintenanceStatusDTO statusDto)
        {
            await _maintenanceService.UpdateRequestStatusAsync(id, statusDto.Status);
            return NoContent();
        }

        [HttpPut("{id}/assign")]
        public async Task<IActionResult> AssignWorker(
            int id,
            [FromBody] AssignWorkerDTO assignDto)
        {
            await _maintenanceService.AssignWorkerAsync(id, assignDto.WorkerId);
            return NoContent();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<MaintenanceResponseDTO>> GetRequestById(int id)
        {
            var request = await _maintenanceService.GetRequestByIdAsync(id);
            if (request == null) return NotFound();
            return _mapper.Map<MaintenanceResponseDTO>(request);
        }

        [HttpGet("tenant/{tenantId}")]
        public async Task<ActionResult<IEnumerable<MaintenanceResponseDTO>>> GetRequestsByTenant(int tenantId)
        {
            var requests = await _maintenanceService.GetRequestsByTenantAsync(tenantId);
            return Ok(_mapper.Map<IEnumerable<MaintenanceResponseDTO>>(requests));
        }

        [HttpGet("property/{propertyId}")]
        public async Task<ActionResult<IEnumerable<MaintenanceResponseDTO>>> GetRequestsByProperty(int propertyId)
        {
            var requests = await _maintenanceService.GetRequestsByPropertyAsync(propertyId);
            return Ok(_mapper.Map<IEnumerable<MaintenanceResponseDTO>>(requests));
        }
    }
}
