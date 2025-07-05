using AutoMapper;
using FluentAssertions;
using HouseRentAPI.Controllers;
using HouseRentAPI.DTOs;
using HouseRentAPI.Enums;
using HouseRentAPI.Interfaces;
using HouseRentAPI.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using System.Security.Claims;

namespace HouseRentSystemAPI.Tests
{
    public class UserControllerTests
    {
        private readonly Mock<IUserService> _userServiceMock = new();
        private readonly Mock<ITokenService> _tokenServiceMock = new();
        private readonly Mock<IMapper> _mapperMock = new();
        private readonly UserController _controller;

        public UserControllerTests()
        {
            _controller = new UserController(
                _userServiceMock.Object,
                _tokenServiceMock.Object,
                _mapperMock.Object
            );
        }

        private void SetupAuthenticatedUser(int userId)
        {
            var claims = new[] {
                new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
                new Claim(ClaimTypes.Role, "Tenant")
            };

            var identity = new ClaimsIdentity(claims, "TestAuth");
            var principal = new ClaimsPrincipal(identity);

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = principal }
            };
        }

        [Fact]
        public async Task Register_ValidRequest_ReturnsAuthResponse()
        {
            // Arrange
            var registrationDto = new UserRegistrationDto
            {
                FullName = "Test User",
                Email = "test@example.com",
                Password = "P@ssw0rd",
                PhoneNumber = "+8801712345678",
                NID = "1234567890123",
                Role = "Tenant"
            };

            var user = new User
            {
                UserId = 1,
                FullName = "Test User",
                Email = "test@example.com",
                PasswordHash = "hashed_password", // Replace with actual hash logic if needed
                PhoneNumber = "+8801712345678",
                Role = UserRole.Tenant, // Assuming UserRole is an enum
                NID = "1234567890123"
            };

            var authResponse = new AuthResponseDto { Token = "test_token" };

            _mapperMock.Setup(m => m.Map<User>(registrationDto))
                .Returns(user);

            _userServiceMock.Setup(s => s.RegisterUserAsync(user, registrationDto.Password))
                .ReturnsAsync(user);

            _tokenServiceMock.Setup(t => t.GenerateTokenAsync(user))
                .ReturnsAsync("test_token");

            _mapperMock.Setup(m => m.Map<UserProfileDto>(user))
                .Returns(new UserProfileDto { UserId = 1 });

            // Act
            var result = await _controller.Register(registrationDto);

            // Assert
            result.Should().BeOfType<OkObjectResult>();
            var response = (result as OkObjectResult).Value as AuthResponseDto;
            response.Should().NotBeNull();
            response.Token.Should().Be("test_token");
            response.UserProfile.UserId.Should().Be(1);
        }

        [Fact]
        public async Task Register_ExistingEmail_ReturnsBadRequest()
        {
            // Arrange
            var registrationDto = new UserRegistrationDto { Email = "test@example.com" };
            _userServiceMock.Setup(s => s.RegisterUserAsync(It.IsAny<User>(), It.IsAny<string>()))
                .ThrowsAsync(new InvalidOperationException("Email already registered"));

            // Act
            var result = await _controller.Register(registrationDto);

            // Assert
            result.Should().BeOfType<BadRequestObjectResult>();
            var response = (result as BadRequestObjectResult)?.Value as ErrorResponse;
            response.Should().NotBeNull();
            response?.Message.Should().Be("Email already registered");            
        }

        [Fact]
        public async Task Login_ValidCredentials_ReturnsAuthResponse()
        {
            // Arrange
            var loginDto = new UserLoginDto
            {
                Email = "valid@test.com",
                Password = "P@ssw0rd"
            };

            var user = new User
            {
                UserId = 1,
                FullName = "Valid User",
                Email = "valid@test.com",
                PasswordHash = "hashed_password", // Replace with actual hash logic if needed
                PhoneNumber = "+8801712345678",
                Role = UserRole.Tenant, // Assuming UserRole is an enum
                NID = "1234567890123"
            };

            _userServiceMock.Setup(s => s.AuthenticateAsync(loginDto.Email, loginDto.Password))
                .ReturnsAsync(user);

            _tokenServiceMock.Setup(t => t.GenerateTokenAsync(user))
                .ReturnsAsync("test_token");

            _mapperMock.Setup(m => m.Map<UserProfileDto>(user))
                .Returns(new UserProfileDto { UserId = 1 });

            // Act
            var result = await _controller.Login(loginDto);

            // Assert
            result.Should().BeOfType<OkObjectResult>();
            var response = (result as OkObjectResult).Value as AuthResponseDto;
            response.Token.Should().Be("test_token");
            response.UserProfile.UserId.Should().Be(1);
        }

        [Fact]
        public async Task Login_InvalidCredentials_ReturnsUnauthorized()
        {
            // Arrange
            var loginDto = new UserLoginDto { Email = "wrong@example.com", Password = "wrong" };
            _userServiceMock.Setup(s => s.AuthenticateAsync(It.IsAny<string>(), It.IsAny<string>()))
                .ThrowsAsync(new UnauthorizedAccessException("Invalid credentials"));

            // Act
            var result = await _controller.Login(loginDto);

            // Assert
            result.Should().BeOfType<UnauthorizedObjectResult>();
            var response = (result as UnauthorizedObjectResult)?.Value as ErrorResponse;
            response.Should().NotBeNull();
            response?.Message.Should().Be("Invalid credentials");
        }

        [Fact]
        public async Task GetProfile_AuthenticatedUser_ReturnsProfile()
        {
            // Arrange
            const int userId = 1;
            SetupAuthenticatedUser(userId);

            var user = new User
            {
                UserId = 1,
                FullName = "Test User",
                Email = "test@example.com",
                PasswordHash = "hashed_password", // Replace with actual hash logic if needed
                PhoneNumber = "+8801712345678",
                Role = UserRole.Tenant,
                NID = "1234567890123"
            };
            var profileDto = new UserProfileDto { UserId = userId };

            _userServiceMock.Setup(s => s.GetUserByIdAsync(userId))
                .ReturnsAsync(user);

            _mapperMock.Setup(m => m.Map<UserProfileDto>(user))
                .Returns(profileDto);

            // Act
            var result = await _controller.GetProfile();

            // Assert
            result.Should().BeOfType<OkObjectResult>();
            var response = (result as OkObjectResult).Value as UserProfileDto;
            response.UserId.Should().Be(userId);
        }

        [Fact]
        public async Task GetProfile_UserNotFound_ReturnsNotFound()
        {
            // Arrange
            SetupAuthenticatedUser(1);
            _userServiceMock.Setup(s => s.GetUserByIdAsync(It.IsAny<int>()))
                .ThrowsAsync(new KeyNotFoundException("User not found"));

            // Act
            var result = await _controller.GetProfile();

            // Assert
            result.Should().BeOfType<NotFoundObjectResult>();
        }

        [Fact]
        public async Task UpdateProfile_ValidRequest_ReturnsUpdatedProfile()
        {
            // Arrange
            const int userId = 1;
            SetupAuthenticatedUser(userId);

            var updateDto = new UserUpdateDto
            {
                FullName = "Updated Name",
                PhoneNumber = "+8801712345678"
            };

            var user = new User
            {
                UserId = 1,
                FullName = "Test User",
                Email = "test@example.com",
                PasswordHash = "hashed_password", // Replace with actual hash logic if needed
                PhoneNumber = "+8801712345678",
                Role = UserRole.Tenant, // Assuming UserRole is an enum
                NID = "1234567890123"
            };
            var updatedProfile = new UserProfileDto { UserId = userId, FullName = "Updated Name" };

            _userServiceMock.Setup(s => s.GetUserByIdAsync(userId))
                .ReturnsAsync(user);

            _userServiceMock.Setup(s => s.UpdateUserAsync(user))
                .Returns(Task.CompletedTask);

            _mapperMock.Setup(m => m.Map<UserProfileDto>(user))
                .Returns(updatedProfile);

            // Act
            var result = await _controller.UpdateProfile(updateDto);

            // Assert
            result.Should().BeOfType<OkObjectResult>();
            var response = (result as OkObjectResult).Value as UserProfileDto;
            response.FullName.Should().Be("Updated Name");
        }

        [Fact]
        public async Task UpdateProfile_PasswordChangeValid_UpdatesPassword()
        {
            // Arrange
            const int userId = 1;
            SetupAuthenticatedUser(userId);

            var updateDto = new UserUpdateDto
            {
                CurrentPassword = "oldPass",
                NewPassword = "newPass"
            };

            var user = new User
            {
                UserId = 1,
                FullName = "Test User",
                Email = "test@example.com",
                PasswordHash = "hashed_password", // Replace with actual hash logic if needed
                PhoneNumber = "+8801712345678",
                Role = UserRole.Tenant, // Assuming UserRole is an enum
                NID = "1234567890123"
            };

            _userServiceMock.Setup(s => s.GetUserByIdAsync(userId))
                .ReturnsAsync(user);

            _userServiceMock.Setup(s => s.UpdatePasswordAsync(
                userId, updateDto.CurrentPassword, updateDto.NewPassword))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _controller.UpdateProfile(updateDto);

            // Assert
            result.Should().BeOfType<OkObjectResult>();
            _userServiceMock.Verify(s => s.UpdatePasswordAsync(
                userId, "oldPass", "newPass"), Times.Once);
        }

        [Fact]
        public async Task UpdateProfile_InvalidPassword_ReturnsBadRequest()
        {
            // Arrange
            SetupAuthenticatedUser(1);
            var updateDto = new UserUpdateDto
            {
                CurrentPassword = "wrongPass",
                NewPassword = "newPass"
            };

            _userServiceMock.Setup(s => s.GetUserByIdAsync(It.IsAny<int>()))
                .ReturnsAsync(new User
                {
                    UserId = 1,
                    FullName = "Test User",
                    Email = "test@example.com",
                    PasswordHash = "invalid_password_hash",
                    PhoneNumber = "+8801712345678",
                    Role = UserRole.Tenant,
                    NID = "1234567890123"
                });

            _userServiceMock.Setup(s => s.UpdatePasswordAsync(
                It.IsAny<int>(), "wrongPass", "newPass"))
                .ThrowsAsync(new InvalidOperationException("Current password is incorrect"));

            // Act
            var result = await _controller.UpdateProfile(updateDto);

            // Assert
            result.Should().BeOfType<BadRequestObjectResult>();
            var response = (result as BadRequestObjectResult)?.Value as ErrorResponse;
            response.Should().NotBeNull();
            response?.Message.Should().Be("Current password is incorrect");
        }

        //[Fact]
        //public async Task VerifyNID_AdminUser_ReturnsVerificationStatus()
        //{
        //    // Arrange
        //    const int userId = 2;
        //    const int adminId = 1;

        //    SetupAuthenticatedUser(adminId);
        //    var claims = _controller.HttpContext.User.Claims.ToList();
        //    claims.Add(new Claim(ClaimTypes.Role, "Admin"));
        //    _controller.HttpContext.User = new ClaimsPrincipal(new ClaimsIdentity(claims));

        //    _userServiceMock.Setup(s => s.VerifyNIDAsync(userId, "1234567890"))
        //        .ReturnsAsync(true);

        //    // Act
        //    var result = await _controller.VerifyNID(userId, "1234567890");

        //    // Assert
        //    result.Should().BeOfType<OkObjectResult>();
        //    var response = (result as OkObjectResult).Value as dynamic;
        //    ((bool)response.isVerified).Should().BeTrue();
        //}

        //[Fact]
        //public async Task VerifyNID_NonAdminUser_ReturnsForbidden()
        //{
        //    // Arrange
        //    SetupAuthenticatedUser(1); // Regular user, not admin
        //    _controller.HttpContext.User = new ClaimsPrincipal(new ClaimsIdentity(new[]
        //    {
        //        new Claim(ClaimTypes.NameIdentifier, "1"),
        //        new Claim(ClaimTypes.Role, "Tenant")
        //    }));

        //    // Act
        //    var result = await _controller.VerifyNID(2, "1234567890");

        //    // Assert
        //    result.Should().BeOfType<ForbidResult>();
        //}

        //[Fact]
        //public async Task VerifyNID_UserNotFound_ReturnsNotFound()
        //{
        //    // Arrange
        //    const int userId = 99;
        //    SetupAuthenticatedUser(1);
        //    var claims = _controller.HttpContext.User.Claims.ToList();
        //    claims.Add(new Claim(ClaimTypes.Role, "Admin"));
        //    _controller.HttpContext.User = new ClaimsPrincipal(new ClaimsIdentity(claims));

        //    _userServiceMock.Setup(s => s.VerifyNIDAsync(userId, It.IsAny<string>()))
        //        .ThrowsAsync(new KeyNotFoundException("User not found"));

        //    // Act
        //    var result = await _controller.VerifyNID(userId, "1234567890");

        //    // Assert
        //    result.Should().BeOfType<NotFoundObjectResult>();
        //}
    }
}