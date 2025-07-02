using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HouseRentAPI.Models
{
    public class PropertyImage
    {
        [Key]
        public int ImageId { get; set; }

        [Required]
        public required string ImagePath { get; set; }

        // Foreign Key
        [ForeignKey("Property")]
        public int PropertyId { get; set; }

        // Navigation Property
        public Property Property { get; set; }
    }
}
