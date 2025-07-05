using AutoMapper;
using HouseRentAPI.Controllers;
using HouseRentAPI.DTOs;
using HouseRentAPI.Interfaces;
using HouseRentAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Moq;



namespace HouseRentSystemAPI.Tests
{
    public class MaintenanceRequestControllerTests
    {
        private readonly Mock<IMaintenanceService> _mockService;
        private readonly Mock<IMapper> _mockMapper;
        private readonly MaintenanceRequestController _controller;

        public MaintenanceRequestControllerTests()
        {
            _mockService = new Mock<IMaintenanceService>();
            _mockMapper = new Mock<IMapper>();
            _controller = new MaintenanceRequestController(_mockService.Object, _mockMapper.Object);
        }

        [Fact]
        public async Task CreateRequest_ValidInput_ReturnsCreatedResult()
        {
            // Arrange
            var createDto = new CreateMaintenanceRequestDTO
            {
                Description = "Leaky faucet",
                PropertyId = 1,
                TenantId = 1
            };

            var request = new MaintenanceRequest { RequestId = 1 };
            var responseDto = new MaintenanceResponseDTO { RequestId = 1 };

            _mockMapper.Setup(m => m.Map<MaintenanceRequest>(createDto)).Returns(request);
            _mockService.Setup(s => s.CreateRequestAsync(request))
                .ReturnsAsync(request);
            _mockMapper.Setup(m => m.Map<MaintenanceResponseDTO>(request)).Returns(responseDto);

            // Act
            var result = await _controller.CreateRequest(createDto);

            // Assert
            var createdAtResult = Assert.IsType<CreatedAtActionResult>(result.Result);
            Assert.Equal(nameof(MaintenanceRequestController.GetRequestById), createdAtResult.ActionName);
            Assert.Equal(1, ((MaintenanceResponseDTO)createdAtResult.Value).RequestId);
        }

        //[Fact]
        //public async Task AssignWorker_ValidInput_ReturnsNoContent()
        //{
        //    // Arrange
        //    var assignDto = new AssignWorkerDTO { WorkerId = 3 };

        //    // Act
        //    var result = await _controller.AssignWorker(1, assignDto);

        //    // Assert
        //    Assert.IsType<NoContentResult>(result);
        //    _mockService.Verify(s => s.AssignWorkerAsync(1, 3), Times.Once);
        //}

        // Additional tests for:
        // - 404 responses
        // - 400 Bad requests
        // - All controller actions
        // - Authorization checks
    }
}
