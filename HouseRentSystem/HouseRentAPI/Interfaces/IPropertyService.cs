using HouseRentAPI.Models;
using static HouseRentAPI.Services.PropertyService;

namespace HouseRentAPI.Interfaces
{
    public interface IPropertyService
    {
        Task<Property> CreatePropertyAsync(Property property, int landlordId);
        Task UpdatePropertyAsync(Property property);
        Task DeletePropertyAsync(int id);
        Task<Property> GetPropertyByIdAsync(int id);
        Task<IEnumerable<Property>> GetPropertiesByLandlordAsync(int landlordId);
        Task<PaginatedResult<Property>> SearchPropertiesAsync(string city, decimal? minRent, decimal? maxRent, int page,int pageSize,string sortBy, string sortDirection);
        Task AddPropertyImagesAsync(int propertyId, IEnumerable<IFormFile> images);
        Task TogglePropertyAvailabilityAsync(int propertyId);
    }
}
