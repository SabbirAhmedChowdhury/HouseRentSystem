using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HouseRentAPI.Models
{
    public class Property
    {
        public int PropertyId { get; set; }
        public DateTime CreatedAt { get; set; }
        public required string Address { get; set; }
        public required string City { get; set; }
        public decimal RentAmount { get; set; }
        public decimal SecurityDeposit { get; set; }
        public int Bedrooms { get; set; }
        public int Bathrooms { get; set; }
        public string? Amenities { get; set; }
        public string? Description { get; set; }
        public bool IsAvailable { get; set; }
        public int LandlordId { get; set; }
        public User Landlord { get; set; }
        public ICollection<Lease> Leases { get; set; }
        public ICollection<MaintenanceRequest> MaintenanceRequests { get; set; }
        public ICollection<UtilityBill> UtilityBills { get; set; }
        public ICollection<PropertyImage> Images { get; set; }
       
    }
}
