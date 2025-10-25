using AutoMapper;
using HouseRentAPI.DTOs;
using HouseRentAPI.Interfaces;
using HouseRentAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using System.Security.Claims;

namespace HouseRentAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly ITokenService _tokenService;
        private readonly IMapper _mapper;

        public UserController(
            IUserService userService,
            ITokenService tokenService,
            IMapper mapper)
        {
            _userService = userService;
            _tokenService = tokenService;
            _mapper = mapper;
        }

        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<IActionResult> Register([FromBody] UserRegistrationDto registrationDto)
        {
            try
            {
                if (registrationDto.Role == "Admin")
                {
                    return BadRequest(new ErrorResponse { Message = "Invalid role specified." });
                }
                var user = _mapper.Map<User>(registrationDto);
                var registeredUser = await _userService.RegisterUserAsync(user, registrationDto.Password);

                // Generate token
                var token = await _tokenService.GenerateTokenAsync(registeredUser);

                return Ok(new AuthResponseDto
                {
                    Token = token,
                    UserProfile = _mapper.Map<UserProfileDto>(registeredUser),
                    TokenExpiration = DateTime.Now.AddHours(3)
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new ErrorResponse { Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ErrorResponse { Message = ex.Message });
            }
        }

        [EnableRateLimiting("login")]
        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] UserLoginDto loginDto)
        {
            try
            {
                var user = await _userService.AuthenticateAsync(loginDto.Email, loginDto.Password);
                var token = await _tokenService.GenerateTokenAsync(user);

                return Ok(new AuthResponseDto
                {
                    Token = token,
                    UserProfile = _mapper.Map<UserProfileDto>(user),
                    TokenExpiration = DateTime.Now.AddHours(3)
                });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new ErrorResponse { Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ErrorResponse { Message = ex.Message });
            }
        }

        [Authorize]
        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            try
            {
                var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
                var user = await _userService.GetUserByIdAsync(userId);
                return Ok(_mapper.Map<UserProfileDto>(user));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new ErrorResponse { Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ErrorResponse { Message = ex.Message });
            }
        }

        [Authorize]
        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UserUpdateDto updateDto)
        {
            try
            {
                var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
                var user = await _userService.GetUserByIdAsync(userId);

                // Update properties
                user.FullName = updateDto.FullName ?? user.FullName;
                user.PhoneNumber = updateDto.PhoneNumber ?? user.PhoneNumber;

                // Password update
                if (!string.IsNullOrEmpty(updateDto.NewPassword))
                {
                    await _userService.UpdatePasswordAsync(userId,
                        updateDto.CurrentPassword, updateDto.NewPassword);
                }

                await _userService.UpdateUserAsync(user);
                return Ok(_mapper.Map<UserProfileDto>(user));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new ErrorResponse { Message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new ErrorResponse { Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ErrorResponse { Message = ex.Message });
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("verify-nid/{userId}")]
        public async Task<IActionResult> VerifyNID(int userId)
        {
            try
            {
                var isVerified = await _userService.VerifyNIDAsync(userId);
                return Ok(new { isVerified });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new ErrorResponse { Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ErrorResponse { Message = ex.Message });
            }
        }
    }
}
