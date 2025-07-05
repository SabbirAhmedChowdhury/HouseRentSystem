using AutoMapper;
using HouseRentAPI.Controllers;
using HouseRentAPI.DTOs;
using HouseRentAPI.Interfaces;
using HouseRentAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace HouseRentSystemAPI.Tests
{
    public class LeaseControllerTests
    {
        private readonly Mock<ILeaseService> _mockService;
        private readonly Mock<IMapper> _mockMapper;
        private readonly LeaseController _controller;

        public LeaseControllerTests()
        {
            _mockService = new Mock<ILeaseService>();
            _mockMapper = new Mock<IMapper>();
            _controller = new LeaseController(_mockService.Object, _mockMapper.Object);
        }

        [Fact]
        public async Task CreateLease_ValidInput_ReturnsCreatedResult()
        {
            // Arrange
            var createDto = new CreateLeaseDTO { /* populated DTO */ };
            var lease = new Lease();
            var responseDto = new LeaseResponseDTO { LeaseId = 1 };

            _mockMapper.Setup(m => m.Map<Lease>(createDto)).Returns(lease);
            _mockService.Setup(s => s.CreateLeaseAsync(lease, createDto.PropertyId, createDto.TenantId))
                .ReturnsAsync(lease);
            _mockMapper.Setup(m => m.Map<LeaseResponseDTO>(lease)).Returns(responseDto);

            // Act
            var result = await _controller.CreateLease(createDto);

            // Assert
            var createdAtResult = Assert.IsType<CreatedAtActionResult>(result.Result);
            Assert.Equal(nameof(LeaseController.GetLeaseById), createdAtResult.ActionName);
            Assert.Equal(1, ((LeaseResponseDTO)createdAtResult.Value).LeaseId);
        }

        //[Fact]
        //public async Task GenerateDocument_ValidId_ReturnsFileResult()
        //{
        //    // Arrange
        //    _mockService.Setup(s => s.GenerateLeaseDocumentAsync(1))
        //        .ReturnsAsync("path/to/document.pdf");

        //    // Act
        //    var result = await _controller.GenerateLeaseDocument(1);

        //    // Assert
        //    Assert.IsType<FileContentResult>(result);
        //}

        // Additional tests for:
        // - 404 responses
        // - Conflict responses
        // - Bad requests
        // - All controller actions
    }
}
