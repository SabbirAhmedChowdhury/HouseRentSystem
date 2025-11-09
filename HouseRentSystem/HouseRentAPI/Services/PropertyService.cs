using HouseRentAPI.DTOs;
using HouseRentAPI.Enums;
using HouseRentAPI.Exceptions;
using HouseRentAPI.Interfaces;
using HouseRentAPI.Models;
using Microsoft.EntityFrameworkCore;
using static iText.StyledXmlParser.Jsoup.Select.Evaluator;

namespace HouseRentAPI.Services
{
    public class PropertyService : IPropertyService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IFileStorageService _fileStorageService;

        public PropertyService(IUnitOfWork unitOfWork, IFileStorageService fileStorageService)
        {
            _unitOfWork = unitOfWork;
            _fileStorageService = fileStorageService;
        }

        public async Task<Property> CreatePropertyAsync(Property property, IEnumerable<IFormFile>? images = null)
        {
            var propertyRepo = _unitOfWork.GetRepository<Property>();
            var userRepo = _unitOfWork.GetRepository<User>();

            var landlord = await userRepo.GetByIdAsync(property.LandlordId);
            if (landlord == null || landlord.Role != UserRole.Landlord)
                //throw new InvalidOperationException("Invalid landlord");
                throw new BadRequestException("Invalid landlord");

            property.CreatedAt = DateTime.Now;

            await propertyRepo.AddAsync(property);
            await _unitOfWork.SaveChangesAsync();

            // Add images if provided
            if (images != null && images.Any())
            {
                await AddPropertyImagesAsync(property.PropertyId, images);
            }

            return property;
        }

        public async Task<IEnumerable<Property>> GetAllPropertiesAsync()
        {
            var propertyRepo = _unitOfWork.GetRepository<Property>();
            return await propertyRepo.GetAllAsync();
        }

        public async Task UpdatePropertyAsync(Property property, IEnumerable<IFormFile>? images = null)
        {
            var propertyRepo = _unitOfWork.GetRepository<Property>();
            propertyRepo.Update(property);
            await _unitOfWork.SaveChangesAsync();

            // Add new images if provided
            if (images != null && images.Any())
            {
                await AddPropertyImagesAsync(property.PropertyId, images);
            }
        }

        public async Task DeletePropertyAsync(int id)
        {
            var propertyRepo = _unitOfWork.GetRepository<Property>();
            var property = await propertyRepo.GetByIdAsync(id);

            //if (property == null) throw new KeyNotFoundException("Property not found");
            if (property == null) throw new NotFoundException(nameof(Property), id);

            propertyRepo.Remove(property);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task<Property> GetPropertyByIdAsync(int id)
        {
            var propertyRepo = _unitOfWork.GetRepository<Property>();
            return await propertyRepo.GetByIdAsync(
                p => p.PropertyId == id,
                p => p.Landlord,
                p => p.Images,
                p => p.Leases
            );
        }

        public async Task<IEnumerable<Property>> GetPropertiesByLandlordAsync(int landlordId)
        {
            var propertyRepo = _unitOfWork.GetRepository<Property>();
            return await propertyRepo.FindAsync(
                p => p.LandlordId == landlordId,
                p => p.Images
            );
        }

        public async Task<PaginatedResult<Property>> SearchPropertiesAsync(
    string city,
    decimal? minRent,
    decimal? maxRent,
    int? bedRooms = 2,
    int page = 1,
    int pageSize = 10,
    string sortBy = "Rent",
    string sortDirection = "asc")
        {
            var propertyRepo = _unitOfWork.GetRepository<Property>();

            IQueryable<Property> query = propertyRepo.Queryable()
                .Where(p => p.IsAvailable)
                .Include(p => p.Images);

            // Apply filters
            if (!string.IsNullOrEmpty(city))
            {
                query = query.Where(p => EF.Functions.Like(p.City, $"%{city}%"));
            }

            if (minRent.HasValue)
            {
                query = query.Where(p => p.RentAmount >= minRent.Value);
            }

            if (maxRent.HasValue)
            {
                query = query.Where(p => p.RentAmount <= maxRent.Value);
            }

            if (bedRooms.HasValue)
            {
                query = query.Where(p => p.Bedrooms == bedRooms.Value);
            }

            // Apply sorting
            query = sortBy.ToLower() switch
            {
                "bedrooms" => sortDirection.ToLower() == "desc"
                    ? query.OrderByDescending(p => p.Bedrooms)
                    : query.OrderBy(p => p.Bedrooms),

                "bathrooms" => sortDirection.ToLower() == "desc"
                    ? query.OrderByDescending(p => p.Bathrooms)
                    : query.OrderBy(p => p.Bathrooms),

                "date" => sortDirection.ToLower() == "desc"
                    ? query.OrderByDescending(p => p.CreatedAt)
                    : query.OrderBy(p => p.CreatedAt),

                _ => sortDirection.ToLower() == "desc"
                    ? query.OrderByDescending(p => p.RentAmount)
                    : query.OrderBy(p => p.RentAmount)
            };

            // Get total count
            int totalItems = await query.CountAsync();

            // Apply pagination
            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return new PaginatedResult<Property>(items, totalItems, page, pageSize);
        }

        public async Task AddPropertyImagesAsync(int propertyId, IEnumerable<IFormFile> images)
        {
            var propertyRepo = _unitOfWork.GetRepository<Property>();
            var imageRepo = _unitOfWork.GetRepository<PropertyImage>();

            var property = await propertyRepo.GetByIdAsync(propertyId);
            //if (property == null) throw new KeyNotFoundException("Property not found");
            if (property == null) throw new NotFoundException(nameof(Property), propertyId);

            foreach (var image in images)
            {
                var imagePath = await _fileStorageService.SaveImageAsync(image);
                await imageRepo.AddAsync(new PropertyImage
                {
                    PropertyId = propertyId,
                    ImagePath = imagePath
                });
            }

            await _unitOfWork.SaveChangesAsync();
        }

        public async Task TogglePropertyAvailabilityAsync(int propertyId)
        {
            var propertyRepo = _unitOfWork.GetRepository<Property>();
            var property = await propertyRepo.GetByIdAsync(propertyId);

            //if (property == null) throw new KeyNotFoundException("Property not found");
            if (property == null) throw new NotFoundException(nameof(Property), propertyId);

            property.IsAvailable = !property.IsAvailable;
            propertyRepo.Update(property);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task<bool> IsOwner(int propertyId, int userId)
        {
            var property = await _unitOfWork.GetRepository<Property>()
                .FirstOrDefaultAsync(p => p.PropertyId == propertyId);

            //if (property == null) throw new KeyNotFoundException("Property not found");
            if (property == null) throw new NotFoundException(nameof(Property), propertyId);

            return property?.LandlordId == userId;
        }

        /// <summary>
        /// Deletes a specific property image by image ID
        /// Verifies ownership before deletion
        /// </summary>
        /// <param name="imageId">ID of the image to delete</param>
        /// <param name="userId">ID of the user requesting deletion</param>
        /// <param name="isAdmin">Whether the user is an admin</param>
        public async Task DeletePropertyImageAsync(int imageId, int userId, bool isAdmin = false)
        {
            var imageRepo = _unitOfWork.GetRepository<PropertyImage>();
            var propertyRepo = _unitOfWork.GetRepository<Property>();
            
            // Get image with property information
            var image = await imageRepo.GetByIdAsync(imageId);
            if (image == null) throw new NotFoundException(nameof(PropertyImage), imageId);

            // Verify ownership
            var property = await propertyRepo.GetByIdAsync(image.PropertyId);
            if (property == null) throw new NotFoundException(nameof(Property), image.PropertyId);
            
            if (!isAdmin && property.LandlordId != userId)
                throw new UnauthorizedAccessException("You do not have permission to delete this image");

            // Delete physical file
            await _fileStorageService.DeleteFileAsync(image.ImagePath);

            // Delete database record
            imageRepo.Remove(image);
            await _unitOfWork.SaveChangesAsync();
        }
        
    }
}
