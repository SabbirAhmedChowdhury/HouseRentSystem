using AutoMapper;
using HouseRentAPI.DTOs;
using HouseRentAPI.Models;

namespace HouseRentAPI.Profiles
{
    public class PaymentMappingProfile : Profile
    {
        public PaymentMappingProfile()
        {
            // Request DTO to Entity
            CreateMap<CreatePaymentRecordDTO, RentPayment>()
                .ForMember(dest => dest.AmountPaid, opt => opt.MapFrom(src => src.Amount))
                .ForMember(dest => dest.PaymentType, opt => opt.MapFrom(src => src.PaymentType))
                .ForMember(dest => dest.Status, opt => opt.Ignore())
                .ForMember(dest => dest.PaymentDate, opt => opt.Ignore())
                .ForMember(dest => dest.PaymentMethod, opt => opt.Ignore())
                .ForMember(dest => dest.PaymentSlipPath, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore());

            // Entity to Response DTO
            CreateMap<RentPayment, PaymentResponseDTO>();
            CreateMap<Lease, LeaseBasicDTO>();
            CreateMap<Property, PropertyBasicDTO>();
            CreateMap<User, UserBasicDTO>();
            CreateMap<RentPayment, PaymentHistoryResponseDTO>()
            .ForMember(dest => dest.PropertyAddress, opt => opt.MapFrom(src => src.Lease.Property.Address));

            // Update DTO to Entity
            CreateMap<UpdatePaymentStatusDTO, RentPayment>()
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status))
                .ForMember(dest => dest.PaymentId, opt => opt.Ignore())
                .ForMember(dest => dest.DueDate, opt => opt.Ignore())
                .ForMember(dest => dest.PaymentDate, opt => opt.Ignore())
                .ForMember(dest => dest.AmountPaid, opt => opt.Ignore())
                .ForMember(dest => dest.PaymentMethod, opt => opt.Ignore())
                .ForMember(dest => dest.PaymentSlipPath, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.LeaseId, opt => opt.Ignore())
                .ForMember(dest => dest.Lease, opt => opt.Ignore());            
        }
    }
}
