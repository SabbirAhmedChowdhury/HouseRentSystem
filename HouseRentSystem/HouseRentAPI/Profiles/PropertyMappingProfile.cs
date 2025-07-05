using AutoMapper;
using HouseRentAPI.DTOs;
using HouseRentAPI.Models;

namespace HouseRentAPI.Profiles
{
    public class PropertyMappingProfile : Profile
    {
        public PropertyMappingProfile()
        {
            // Create mappings
            CreateMap<CreatePropertyDto, Property>()
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(_ => DateTime.Now))
                .ForMember(dest => dest.IsAvailable, opt => opt.MapFrom(_ => true));

            CreateMap<UpdatePropertyDto, Property>()
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

            CreateMap<Property, PropertyDto>()
                .ForMember(dest => dest.Images,
                    opt => opt.MapFrom(src => src.Images.Select(i => i.ImagePath).ToList()))
                .ForMember(dest => dest.LandlordName,
                    opt => opt.MapFrom(src => src.Landlord.FullName));

            CreateMap<Property, PropertyListDto>()
                .ForMember(dest => dest.Thumbnail,
                    opt => opt.MapFrom(src => src.Images.FirstOrDefault().ImagePath));
        }
    }
}