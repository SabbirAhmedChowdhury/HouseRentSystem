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

        public IFormFile thumbnail { get; set; }
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
        public List<string> Images { get; set; } = new();
        public int LandlordId { get; set; }
        public string LandlordName { get; set; }
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
    }
}
