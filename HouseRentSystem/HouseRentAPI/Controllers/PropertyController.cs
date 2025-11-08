using AutoMapper;
using HouseRentAPI.DTOs;
using HouseRentAPI.Interfaces;
using HouseRentAPI.Models;
using iText.IO.Image;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace HouseRentAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PropertyController : ControllerBase
    {
        private readonly IPropertyService _propertyService;
        private readonly IMapper _mapper;
        private readonly IFileStorageService _fileService;

        public PropertyController(
            IPropertyService propertyService,
            IMapper mapper,
            IFileStorageService fileService)
        {
            _propertyService = propertyService;
            _mapper = mapper;
            _fileService = fileService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllProperties()
        {
            var properties = await _propertyService.GetAllPropertiesAsync();
            return Ok(_mapper.Map<IEnumerable<PropertyListDto>>(properties));
        }

        [Authorize(Roles = "Landlord")]
        [HttpGet("landlord/{landlordId}")]
        public async Task<IActionResult> GetAllProperties(int landlordId)
        {
            var properties = await _propertyService.GetPropertiesByLandlordAsync(landlordId);
            return Ok(_mapper.Map<IEnumerable<PropertyListDto>>(properties));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetPropertyById(int id)
        {
            var property = await _propertyService.GetPropertyByIdAsync(id);
            if (property == null) return NotFound();

            return Ok(_mapper.Map<PropertyDto>(property));
        }

        [HttpPost]
        [Authorize(Roles = "Landlord")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> CreateProperty([FromForm] CreatePropertyDto createDto)
        {
            var property = _mapper.Map<Property>(createDto);
            property.LandlordId = GetCurrentUserId();

            var createdProperty = await _propertyService.CreatePropertyAsync(property);
            return CreatedAtAction(nameof(GetPropertyById),
                new { id = createdProperty.PropertyId },
                _mapper.Map<PropertyDto>(createdProperty));
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Landlord,Admin")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UpdateProperty(int id, [FromForm] UpdatePropertyDto updateDto)
        {
            if (!await _propertyService.IsOwner(id, GetCurrentUserId()) && !User.IsInRole("Admin"))
                return Forbid();

            var property = await _propertyService.GetPropertyByIdAsync(id);
            if (property == null) return NotFound();

            _mapper.Map(updateDto, property);
            await _propertyService.UpdatePropertyAsync(property);

            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Landlord,Admin")]
        public async Task<IActionResult> DeleteProperty(int id)
        {
            if (!await _propertyService.IsOwner(id, GetCurrentUserId()) && !User.IsInRole("Admin"))
                return Forbid();

            await _propertyService.DeletePropertyAsync(id);
            return NoContent();
        }

        [HttpPost("{id}/images")]
        [Authorize(Roles = "Landlord,Admin")]
        public async Task<IActionResult> UploadPropertyImages(int id, List<IFormFile> images)
        {
            if (!await _propertyService.IsOwner(id, GetCurrentUserId()) && !User.IsInRole("Admin"))
                return Forbid();

            await _propertyService.AddPropertyImagesAsync(id, images);

            return Ok();
        }

        [HttpGet("search")]
        public async Task<IActionResult> SearchProperties([FromQuery] SearchPropertiesDto searchDto)
        {
            var result = await _propertyService.SearchPropertiesAsync(
                searchDto.City,
                searchDto.MinRent,
                searchDto.MaxRent,
                searchDto.Bedrooms,
                searchDto.Page,
                searchDto.PageSize,
                searchDto.SortBy,
                searchDto.SortDirection);

            return Ok(new PaginatedResult<PropertyListDto>(
                _mapper.Map<IEnumerable<PropertyListDto>>(result.Items),
                result.TotalItems,
                result.Page,
                result.PageSize                
            ));
        }

        private int GetCurrentUserId() =>
            int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
    }
}
