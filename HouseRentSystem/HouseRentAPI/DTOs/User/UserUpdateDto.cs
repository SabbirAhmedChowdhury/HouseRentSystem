namespace HouseRentAPI.DTOs.User
{
    public class UserUpdateDto
    {
        public string FullName { get; set; }
        public string PhoneNumber { get; set; }
        public string CurrentPassword { get; set; }
        public string NewPassword { get; set; }
    }
}
