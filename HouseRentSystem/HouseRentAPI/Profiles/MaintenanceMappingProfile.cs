using AutoMapper;
using HouseRentAPI.DTOs;
using HouseRentAPI.Models;


namespace HouseRentAPI.Profiles
{
    public class MaintenanceMappingProfile : Profile
    {
        public MaintenanceMappingProfile()
        {
            // Request DTO to Entity
            CreateMap<CreateMaintenanceRequestDTO, MaintenanceRequest>()
                .ForMember(dest => dest.Status, opt => opt.Ignore())
                .ForMember(dest => dest.RequestDate, opt => opt.Ignore())
                .ForMember(dest => dest.CompletionDate, opt => opt.Ignore())
                .ForMember(dest => dest.AssignedWorkerId, opt => opt.Ignore());

            // Entity to Response DTO
            CreateMap<MaintenanceRequest, MaintenanceResponseDTO>();
            CreateMap<Property, PropertyBasicDTO>();
            CreateMap<User, UserBasicDTO>();

            // Update DTO to Entity
            CreateMap<UpdateMaintenanceStatusDTO, MaintenanceRequest>()
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status))
                .ForMember(dest => dest.RequestId, opt => opt.Ignore())
                .ForMember(dest => dest.Description, opt => opt.Ignore())
                .ForMember(dest => dest.RequestDate, opt => opt.Ignore())
                .ForMember(dest => dest.CompletionDate, opt => opt.Ignore())
                .ForMember(dest => dest.PropertyId, opt => opt.Ignore())
                .ForMember(dest => dest.TenantId, opt => opt.Ignore())
                .ForMember(dest => dest.Property, opt => opt.Ignore())
                .ForMember(dest => dest.Tenant, opt => opt.Ignore())
                .ForMember(dest => dest.AssignedWorkerId, opt => opt.Ignore());
        }
    }
}