using HouseRentAPI.Models;
using System.Security.Claims;

namespace HouseRentAPI.Interfaces
{
    public interface ITokenService
    {
        string GenerateToken(IEnumerable<Claim> claims);
        ClaimsPrincipal GetPrincipalFromToken(string token);
        bool ValidateToken(string token);
        Task<string> GenerateTokenAsync(User user);
    }
}
