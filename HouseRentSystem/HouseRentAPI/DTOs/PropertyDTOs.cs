using System.ComponentModel.DataAnnotations;

namespace HouseRentAPI.DTOs
{
    public class CreatePropertyDto
    {
        [Required]
        [StringLength(200)]
        public string Address { get; set; }

        [Required]
        [StringLength(100)]
        public string City { get; set; }

        [Required]
        [Range(1000, 1000000)]
        public decimal RentAmount { get; set; }

        [Range(0, 1000000)]
        public decimal? SecurityDeposit { get; set; } = 0;

        [Range(1, 10)]
        public int Bedrooms { get; set; } = 1;

        [Range(1, 10)]
        public int Bathrooms { get; set; } = 1;

        [StringLength(500)]
        public string? Amenities { get; set; }

        [StringLength(1000)]
        public string? Description { get; set; }

        /// <summary>
        /// Multiple property images - first image will be used as thumbnail
        /// </summary>
        public List<IFormFile>? Images { get; set; }
    }

    public class PropertyDto
    {
        public int PropertyId { get; set; }
        public string Address { get; set; }
        public string City { get; set; }
        public decimal RentAmount { get; set; }
        public decimal SecurityDeposit { get; set; }
        public int Bedrooms { get; set; }
        public int Bathrooms { get; set; }
        public string Amenities { get; set; }
        public string Description { get; set; }
        public bool IsAvailable { get; set; }
        public DateTime CreatedAt { get; set; }
        /// <summary>
        /// List of image paths (for backward compatibility)
        /// </summary>
        public List<string> Images { get; set; } = new();
        /// <summary>
        /// List of image information with IDs for deletion
        /// </summary>
        public List<PropertyImageDto> ImageDetails { get; set; } = new();
        public int LandlordId { get; set; }
        public string LandlordName { get; set; }
        public string LandlordEmail { get; set; }
        public string LandlordPhone { get; set; }
    }

    /// <summary>
    /// DTO for property image information
    /// </summary>
    public class PropertyImageDto
    {
        public int ImageId { get; set; }
        public string ImagePath { get; set; }
    }

    public class PropertyListDto
    {
        public int PropertyId { get; set; }
        public string Address { get; set; }
        public string City { get; set; }
        public decimal RentAmount { get; set; }
        public int Bedrooms { get; set; }
        public string Thumbnail { get; set; }
        public bool IsAvailable { get; set; }
    }

    public class SearchPropertiesDto
    {
        public string? City { get; set; }
        public decimal? MinRent { get; set; }
        public decimal? MaxRent { get; set; }
        public int? Bedrooms { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public string? SortBy { get; set; } = "RentAmount";
        public string? SortDirection { get; set; } = "asc";
    }

    public class UpdatePropertyDto
    {
        [StringLength(200)]
        public string Address { get; set; }

        [StringLength(100)]
        public string City { get; set; }

        [Range(1000, 1000000)]
        public decimal? RentAmount { get; set; }

        [Range(0, 1000000)]
        public decimal? SecurityDeposit { get; set; }

        [Range(1, 10)]
        public int? Bedrooms { get; set; }

        [Range(1, 10)]
        public int? Bathrooms { get; set; }

        [StringLength(500)]
        public string Amenities { get; set; }

        [StringLength(1000)]
        public string Description { get; set; }

        public bool? IsAvailable { get; set; }

        /// <summary>
        /// Additional property images to add (existing images are preserved)
        /// </summary>
        public List<IFormFile>? Images { get; set; }
    }
}
