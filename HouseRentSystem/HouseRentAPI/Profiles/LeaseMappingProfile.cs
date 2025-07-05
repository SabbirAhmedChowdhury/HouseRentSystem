using AutoMapper;
using HouseRentAPI.DTOs;
using HouseRentAPI.Models;

namespace HouseRentAPI.Profiles
{
    public class LeaseMappingProfile : Profile
    {
        public LeaseMappingProfile()
        {
            // Request DTO to Entity
            CreateMap<CreateLeaseDTO, Lease>();

            // Entity to Response DTO
            CreateMap<Lease, LeaseResponseDTO>();

            // Renew DTO to Entity updates
            CreateMap<RenewLeaseDTO, Lease>()
                .ForMember(dest => dest.EndDate, opt => opt.MapFrom(src => src.NewEndDate))
                .ForMember(dest => dest.StartDate, opt => opt.Ignore())
                .ForMember(dest => dest.MonthlyRent, opt => opt.Ignore())
                .ForMember(dest => dest.TermsAndConditions, opt => opt.Ignore())
                .ForMember(dest => dest.LeaseDocumentPath, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.PropertyId, opt => opt.Ignore())
                .ForMember(dest => dest.TenantId, opt => opt.Ignore())
                .ForMember(dest => dest.Property, opt => opt.Ignore())
                .ForMember(dest => dest.Tenant, opt => opt.Ignore())
                .ForMember(dest => dest.RentPayments, opt => opt.Ignore());
        }
    }
}