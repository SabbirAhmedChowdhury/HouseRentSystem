using AutoMapper;
using HouseRentAPI.DTOs;
using HouseRentAPI.Models;

namespace HouseRentAPI.Profiles
{
    public class UserMappingProfile : Profile
    {
        public UserMappingProfile()
        {
            // Registration DTO to Entity
            CreateMap<UserRegistrationDto, User>()
                .ForMember(dest => dest.PasswordHash, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(_ => DateTime.Now));

            // Entity to Profile DTO
            CreateMap<User, UserProfileDto>();
        }
    }
}