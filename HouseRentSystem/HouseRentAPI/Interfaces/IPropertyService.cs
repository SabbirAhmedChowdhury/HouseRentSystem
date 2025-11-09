using HouseRentAPI.DTOs;
using HouseRentAPI.Models;
using System.Threading.Tasks;

namespace HouseRentAPI.Interfaces
{
    public interface IPropertyService
    {
        Task<Property> CreatePropertyAsync(Property property, IEnumerable<IFormFile>? images = null);
        Task<IEnumerable<Property>> GetAllPropertiesAsync();
        Task<bool> IsOwner(int propertyId, int userId);
        Task UpdatePropertyAsync(Property property, IEnumerable<IFormFile>? images = null);
        Task DeletePropertyAsync(int id);
        Task<Property> GetPropertyByIdAsync(int id);
        Task<IEnumerable<Property>> GetPropertiesByLandlordAsync(int landlordId);
        Task<PaginatedResult<Property>> SearchPropertiesAsync(string city, decimal? minRent, decimal? maxRent, int? bedRooms, int page,int pageSize,string sortBy, string sortDirection);
        Task AddPropertyImagesAsync(int propertyId, IEnumerable<IFormFile> images);
        Task DeletePropertyImageAsync(int imageId, int userId, bool isAdmin = false);
        Task TogglePropertyAvailabilityAsync(int propertyId);
        
    }
}
