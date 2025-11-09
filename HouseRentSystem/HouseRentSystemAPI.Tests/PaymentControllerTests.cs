using AutoMapper;
using HouseRentAPI.Controllers;
using HouseRentAPI.DTOs;
using HouseRentAPI.Enums;
using HouseRentAPI.Interfaces;
using HouseRentAPI.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;


namespace HouseRentSystemAPI.Tests
{
    public class PaymentControllerTests
    {
        private readonly Mock<IPaymentService> _mockService;
        private readonly Mock<IMapper> _mockMapper;
        private readonly PaymentController _controller;

        public PaymentControllerTests()
        {
            _mockService = new Mock<IPaymentService>();
            _mockMapper = new Mock<IMapper>();
            _controller = new PaymentController(_mockService.Object, _mockMapper.Object);
        }

        [Fact]
        public async Task CreatePaymentRecord_ValidInput_ReturnsCreated()
        {
            // Arrange
            var createDto = new CreatePaymentRecordDTO
            {
                LeaseId = 1,
                Amount = 15000,
                DueDate = DateTime.Now.AddDays(30)
            };

            var payment = new RentPayment
            {
                PaymentId = 1,
                PaymentMethod = "BankTransfer"
            };
            var responseDto = new PaymentResponseDTO { PaymentId = 1 };

            _mockMapper.Setup(m => m.Map<RentPayment>(createDto)).Returns(payment);
            _mockService.Setup(s => s.CreatePaymentRecordAsync(1, 15000, createDto.DueDate, PaymentType.Rent))
                .ReturnsAsync(payment);
            _mockMapper.Setup(m => m.Map<PaymentResponseDTO>(payment)).Returns(responseDto);

            // Act
            var result = await _controller.CreatePaymentRecord(createDto);

            // Assert
            var createdAtResult = Assert.IsType<CreatedAtActionResult>(result.Result);
            Assert.Equal(nameof(PaymentController.GetPaymentById), createdAtResult.ActionName);
            Assert.Equal(1, ((PaymentResponseDTO)createdAtResult.Value).PaymentId);
        }

        [Fact]
        public async Task UploadPaymentSlip_ValidFile_ReturnsNoContent()
        {
            // Arrange
            var fileMock = new Mock<IFormFile>();
            fileMock.Setup(f => f.FileName).Returns("slip.pdf");

            // Act
            var result = await _controller.UploadPaymentSlip(1, fileMock.Object);

            // Assert
            Assert.IsType<NoContentResult>(result);
            _mockService.Verify(s => s.UploadPaymentSlipAsync(1, fileMock.Object), Times.Once);
        }

        //[Fact]
        //public async Task CalculateLateFee_ValidId_ReturnsLateFee()
        //{
        //    // Arrange
        //    _mockService.Setup(s => s.CalculateLateFeeAsync(1)).ReturnsAsync(1500);

        //    // Act
        //    var result = await _controller.CalculateLateFee(1);

        //    // Assert
        //    var okResult = Assert.IsType<OkObjectResult>(result.Result);
        //    var response = Assert.IsType<LateFeeResponseDTO>(okResult.Value);
        //    Assert.Equal(1500, response.LateFee);
        //}

        // Additional tests for:
        // - Model validation errors
        // - 404 responses
        // - Authorization requirements
        // - Invalid file types
        // - Status code responses
    }
}