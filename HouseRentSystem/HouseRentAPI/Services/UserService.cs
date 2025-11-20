using HouseRentAPI.Enums;
using HouseRentAPI.Exceptions;
using HouseRentAPI.Interfaces;
using HouseRentAPI.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Text.RegularExpressions;

namespace HouseRentAPI.Services
{
    public class UserService : IUserService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IPasswordHasher<User> _passwordHasher;
        private readonly ITokenService _tokenService;

        public UserService(
            IUnitOfWork unitOfWork,
            IPasswordHasher<User> passwordHasher,
            ITokenService tokenService)
        {
            _unitOfWork = unitOfWork;
            _passwordHasher = passwordHasher;
            _tokenService = tokenService;
        }

        public async Task<User> RegisterUserAsync(User user, string password)
        {
            var userRepo = _unitOfWork.GetRepository<User>();

            // Check if email already exists
            if (await userRepo.AnyAsync(u => u.Email == user.Email))
                //throw new InvalidOperationException("Email already registered");
                throw new ConflictException("Email address already in use");

            // Check if nid already exists
            if (await userRepo.AnyAsync(u => u.NID == user.NID))
                throw new ConflictException("Duplicate national id");

            if (!IsValidPassword(password))
            {
                //throw new InvalidOperationException(
                //    "Password must be at least 8 characters with uppercase, lowercase, number, and special character");

                throw new BadRequestException(
                    "Password must be at least 8 characters with uppercase, lowercase, number, and special character");
            }

            // Hash password
            user.PasswordHash = _passwordHasher.HashPassword(user, password);
            user.CreatedAt = DateTime.Now;

            await userRepo.AddAsync(user);
            await _unitOfWork.SaveChangesAsync();

            return user;
        }

        private bool IsValidPassword(string password)
        {
            return Regex.IsMatch(password, @"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{8,}$");
        }

        public async Task<User> AuthenticateAsync(string email, string password)
        {
            var userRepo = _unitOfWork.GetRepository<User>();
            var user = await userRepo.FirstOrDefaultAsync(u => u.Email == email);

            if (user == null || _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, password) == PasswordVerificationResult.Failed)
                throw new UnauthorizedAccessException("Invalid credentials");

            return user;
        }

        public async Task<User> GetUserByIdAsync(int id)
        {
            var userRepo = _unitOfWork.GetRepository<User>();
            return await userRepo.GetByIdAsync(id);
        }

        public async Task<User> GetUserByEmailAsync(string email)
        {
            var userRepo = _unitOfWork.GetRepository<User>();
            return await userRepo.FirstOrDefaultAsync(u => u.Email == email);
        }

        public async Task UpdateUserAsync(User user)
        {
            var userRepo = _unitOfWork.GetRepository<User>();
            userRepo.Update(user);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task DeleteUserAsync(int id)
        {
            var userRepo = _unitOfWork.GetRepository<User>();
            var user = await userRepo.GetByIdAsync(id);

            //if (user == null) throw new KeyNotFoundException("User not found");
            if (user == null) throw new NotFoundException(nameof(User), id);

            userRepo.Remove(user);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task<bool> VerifyNIDAsync(int userId)
        {
            // In a real system, this would call a government verification API
            var userRepo = _unitOfWork.GetRepository<User>();
            var user = await userRepo.GetByIdAsync(userId);

            //if (user == null) throw new KeyNotFoundException("User not found");
            if (user == null) throw new NotFoundException(nameof(User), userId);

            // Simple mock verification
            bool isVerified = user.NID.Length == 10 || user.NID.Length == 17;

            if (isVerified)
            {
                user.IsNIDVerified = true;
                userRepo.Update(user);
                await _unitOfWork.SaveChangesAsync();
            }

            return isVerified;
        }

        public async Task<IEnumerable<User>> GetLandlordsAsync()
        {
            var userRepo = _unitOfWork.GetRepository<User>();
            return await userRepo.FindAsync(u => u.Role == UserRole.Landlord);
        }

        public async Task<IEnumerable<User>> GetTenantsAsync()
        {
            var userRepo = _unitOfWork.GetRepository<User>();
            return await userRepo.FindAsync(u => u.Role == UserRole.Tenant);
        }

        public async Task<IEnumerable<User>> GetUsersAsync(string? role = null, bool? isNidVerified = null, string sortDirection = "desc")
        {
            var userRepo = _unitOfWork.GetRepository<User>();
            var query = userRepo.Queryable();

            if (!string.IsNullOrWhiteSpace(role) && Enum.TryParse<UserRole>(role, true, out var parsedRole))
            {
                query = query.Where(u => u.Role == parsedRole);
            }

            if (isNidVerified.HasValue)
            {
                query = query.Where(u => u.IsNIDVerified == isNidVerified.Value);
            }

            query = sortDirection?.ToLower() == "asc"
                ? query.OrderBy(u => u.CreatedAt)
                : query.OrderByDescending(u => u.CreatedAt);

            return await query.ToListAsync();
        }

        public async Task UpdatePasswordAsync(int userId, string currentPassword, string newPassword)
        {
            var user = await GetUserByIdAsync(userId);

            if (_passwordHasher.VerifyHashedPassword(user, user.PasswordHash, currentPassword)
                != PasswordVerificationResult.Success)
            {
                //throw new InvalidOperationException("Current password is incorrect");
                throw new BadRequestException("Current password is incorrect");
            }

            user.PasswordHash = _passwordHasher.HashPassword(user, newPassword);
            await UpdateUserAsync(user);
        }
    }
}