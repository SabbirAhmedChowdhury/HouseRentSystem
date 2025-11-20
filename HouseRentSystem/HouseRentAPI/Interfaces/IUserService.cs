using HouseRentAPI.Models;

namespace HouseRentAPI.Interfaces
{
    public interface IUserService
    {
        Task<User> RegisterUserAsync(User user, string password);
        Task<User> AuthenticateAsync(string email, string password);
        Task<User> GetUserByIdAsync(int id);
        Task<User> GetUserByEmailAsync(string email);
        Task UpdateUserAsync(User user);
        Task DeleteUserAsync(int id);
        Task<bool> VerifyNIDAsync(int userId);
        Task<IEnumerable<User>> GetLandlordsAsync();
        Task<IEnumerable<User>> GetTenantsAsync();
        Task UpdatePasswordAsync(int userId, string currentPassword, string newPassword);
        Task<IEnumerable<User>> GetUsersAsync(string? role = null, bool? isNidVerified = null, string sortDirection = "desc");
    }
}
