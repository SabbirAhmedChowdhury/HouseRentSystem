namespace HouseRentAPI.DTOs.User
{
    public class UserProfileDto
    {
        public int Id { get; set; }
        public string FullName { get; set; }
        public string Email { get; set; }
        public string PhoneNumber { get; set; }
        public string NID { get; set; }
        public bool IsNIDVerified { get; set; }
        public string Role { get; set; }
    }
}
