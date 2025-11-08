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
            // Note: TenantId is set in service layer after looking up tenant by email
            CreateMap<CreateLeaseDTO, Lease>()
                .ForMember(dest => dest.IsActive, opt => opt.MapFrom(src => true))
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => DateTime.Now))
                .ForMember(dest => dest.TenantId, opt => opt.Ignore()); // Set in service layer

            // Entity to Response DTO with property and tenant details
            CreateMap<Lease, LeaseResponseDTO>()
                .ForMember(dest => dest.Property, opt => opt.MapFrom(src => src.Property != null ? new PropertyBasicDTO
                {
                    PropertyId = src.Property.PropertyId,
                    Address = src.Property.Address,
                    City = src.Property.City
                } : null))
                .ForMember(dest => dest.Tenant, opt => opt.MapFrom(src => src.Tenant != null ? new UserBasicDTO
                {
                    UserId = src.Tenant.UserId,
                    FullName = src.Tenant.FullName,
                    Email = src.Tenant.Email,
                    PhoneNumber = src.Tenant.PhoneNumber
                } : null));

            // Renew DTO to Entity updates
            CreateMap<RenewLeaseDTO, Lease>()
                .ForMember(dest => dest.EndDate, opt => opt.MapFrom(src => src.NewEndDate))
                .ForMember(dest => dest.IsActive, opt => opt.MapFrom(src => true))
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