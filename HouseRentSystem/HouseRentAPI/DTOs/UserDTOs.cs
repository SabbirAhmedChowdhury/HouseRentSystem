namespace HouseRentAPI.DTOs
{
    public class UserRegistrationDto
    {
        public string FullName { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
        public string PhoneNumber { get; set; }
        public string NID { get; set; }
        public string Role { get; set; } // "Tenant", "Landlord", "Admin"
    }

    public class UserLoginDto
    {
        public string Email { get; set; }
        public string Password { get; set; }
    }

    public class AuthResponseDto
    {
        public string Token { get; set; }
        public UserProfileDto UserProfile { get; set; }
        public DateTime TokenExpiration { get; set; }
    }

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

    public class UserUpdateDto
    {
        public string FullName { get; set; }
        public string PhoneNumber { get; set; }
        public string CurrentPassword { get; set; }
        public string NewPassword { get; set; }
    }
}
