using HouseRentAPI.Enums;
using HouseRentAPI.Exceptions;
using HouseRentAPI.Interfaces;
using HouseRentAPI.Models;
using Microsoft.AspNetCore.Identity;
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

            if (!IsValidPassword(password))
            {
                throw new InvalidOperationException(
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

            if (user == null) throw new KeyNotFoundException("User not found");

            userRepo.Remove(user);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task<bool> VerifyNIDAsync(int userId, string nidNumber)
        {
            // In a real system, this would call a government verification API
            var userRepo = _unitOfWork.GetRepository<User>();
            var user = await userRepo.GetByIdAsync(userId);

            if (user == null) throw new KeyNotFoundException("User not found");

            // Simple mock verification
            bool isVerified = nidNumber.Length == 10 || nidNumber.Length == 17;

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

        public async Task UpdatePasswordAsync(int userId, string currentPassword, string newPassword)
        {
            var user = await GetUserByIdAsync(userId);

            if (_passwordHasher.VerifyHashedPassword(user, user.PasswordHash, currentPassword)
                != PasswordVerificationResult.Success)
            {
                throw new InvalidOperationException("Current password is incorrect");
            }

            user.PasswordHash = _passwordHasher.HashPassword(user, newPassword);
            await UpdateUserAsync(user);
        }
    }
}