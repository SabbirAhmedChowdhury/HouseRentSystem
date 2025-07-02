using AutoMapper;
using HouseRentAPI.DTOs.User;
using HouseRentAPI.Models;

namespace HouseRentAPI.Profiles
{
    public class UserProfile : Profile
    {
        public UserProfile()
        {
            // Registration DTO to Entity
            CreateMap<UserRegistrationDto, User>()
                .ForMember(dest => dest.PasswordHash, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(_ => DateTime.UtcNow));

            // Entity to Profile DTO
            CreateMap<User, UserProfileDto>();
        }
    }
}