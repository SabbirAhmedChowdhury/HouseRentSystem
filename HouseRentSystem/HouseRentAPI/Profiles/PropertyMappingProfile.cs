using AutoMapper;
using HouseRentAPI.DTOs;
using HouseRentAPI.Models;
using System.Linq;

namespace HouseRentAPI.Profiles
{
    public class PropertyMappingProfile : Profile
    {
        public PropertyMappingProfile()
        {
            // Create mappings
            CreateMap<CreatePropertyDto, Property>()
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(_ => DateTime.Now))
                .ForMember(dest => dest.IsAvailable, opt => opt.MapFrom(_ => true))
                .ForMember(dest => dest.Images, opt => opt.Ignore()) // Images are handled separately in service layer
                .ForMember(dest => dest.Landlord, opt => opt.Ignore())
                .ForMember(dest => dest.Leases, opt => opt.Ignore())
                .ForMember(dest => dest.MaintenanceRequests, opt => opt.Ignore())
                .ForMember(dest => dest.UtilityBills, opt => opt.Ignore());

            CreateMap<UpdatePropertyDto, Property>()
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));
            CreateMap<UpdatePropertyDto, Property>()
                .ForMember(dest => dest.Images, opt => opt.Ignore()) // Images are handled separately in service layer
                .ForMember(dest => dest.Landlord, opt => opt.Ignore())
                .ForMember(dest => dest.Leases, opt => opt.Ignore())
                .ForMember(dest => dest.MaintenanceRequests, opt => opt.Ignore())
                .ForMember(dest => dest.UtilityBills, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.PropertyId, opt => opt.Ignore())
                .ForMember(dest => dest.LandlordId, opt => opt.Ignore());

            CreateMap<Property, PropertyDto>()
                .ForMember(dest => dest.Images,
                    opt => opt.MapFrom(src => src.Images.Select(i => i.ImagePath).ToList()))
                .ForMember(dest => dest.ImageDetails,
                    opt => opt.MapFrom(src => src.Images.Select(i => new PropertyImageDto
                    {
                        ImageId = i.ImageId,
                        ImagePath = i.ImagePath
                    }).ToList()))
                .ForMember(dest => dest.LandlordName,
                    opt => opt.MapFrom(src => src.Landlord.FullName))
                .ForMember(dest => dest.LandlordEmail,
                    opt => opt.MapFrom(src => src.Landlord.Email))
                .ForMember(dest => dest.LandlordPhone,
                    opt => opt.MapFrom(src => src.Landlord.PhoneNumber))
                .ForMember(dest => dest.HasActiveLease,
                    opt => opt.MapFrom(src => src.Leases != null && src.Leases.Any(l => l.IsActive)));

            CreateMap<Property, PropertyListDto>()
                .ForMember(dest => dest.Thumbnail,
                    opt => opt.MapFrom(src => src.Images.FirstOrDefault().ImagePath));
        }
    }
}