using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HouseRentAPI.Models
{
    public class UtilityBill
    {
        [Key]
        public int BillId { get; set; }

        [Required]
        [MaxLength(50)]
        public string BillType { get; set; } // Electricity, Water, Gas, etc.

        [Required]
        public decimal Amount { get; set; }

        [Required]
        public DateTime IssueDate { get; set; }

        public DateTime DueDate { get; set; }
        public bool IsPaid { get; set; } = false;

        // Foreign Key
        [ForeignKey("Property")]
        public int PropertyId { get; set; }

        // Navigation Property
        public Property Property { get; set; }
    }
}
