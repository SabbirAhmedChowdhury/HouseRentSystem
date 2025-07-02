namespace HouseRentAPI.DTOs.User
{
    public class AuthResponseDto
    {
        public string Token { get; set; }
        public UserProfileDto UserProfile { get; set; }
        public DateTime TokenExpiration { get; set; }
    }
}
