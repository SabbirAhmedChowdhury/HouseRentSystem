using AutoMapper;
using FluentAssertions;
using HouseRentAPI.Controllers;
using HouseRentAPI.DTOs;
using HouseRentAPI.Interfaces;
using HouseRentAPI.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using System.Security.Claims;

namespace HouseRentSystemAPI.Tests
{
    public class PropertyControllerTests
    {
        private readonly Mock<IPropertyService> _propertyServiceMock = new();
        private readonly Mock<IMapper> _mapperMock = new();
        private readonly Mock<IFileStorageService> _fileServiceMock = new();
        private readonly PropertyController _controller;

        public PropertyControllerTests()
        {
            _controller = new PropertyController(
                _propertyServiceMock.Object,
                _mapperMock.Object,
                _fileServiceMock.Object
            );
        }

        private void SetupAuthenticatedUser(int userId, string role = "Landlord")
        {
            var claims = new[] {
                new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
                new Claim(ClaimTypes.Role, role)
            };

            var identity = new ClaimsIdentity(claims, "TestAuth");
            var principal = new ClaimsPrincipal(identity);

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = principal }
            };
        }

        [Fact]
        public async Task GetPropertyById_ExistingId_ReturnsProperty()
        {
            // Arrange  
            var property = new Property
            {
                PropertyId = 1,
                Address = "123 Main St",
                City = "Sample City"
            };
            var propertyDto = new PropertyDto { PropertyId = 1 };

            _propertyServiceMock.Setup(s => s.GetPropertyByIdAsync(1))
                .ReturnsAsync(property);

            _mapperMock.Setup(m => m.Map<PropertyDto>(property))
                .Returns(propertyDto);

            // Act  
            var result = await _controller.GetPropertyById(1);

            // Assert  
            result.Should().BeOfType<OkObjectResult>();
            var response = (result as OkObjectResult).Value as PropertyDto;
            response.PropertyId.Should().Be(1);
        }

        [Fact]
        public async Task CreateProperty_ValidRequest_ReturnsCreated()
        {
            // Arrange
            SetupAuthenticatedUser(1);
            var createDto = new CreatePropertyDto();
            var property = new Property
            {
                PropertyId = 1,
                LandlordId = 1,
                Address = "123 Main St",
                City = "Sample City"
            };
            var propertyDto = new PropertyDto { PropertyId = 1 };

            _mapperMock.Setup(m => m.Map<Property>(createDto))
                .Returns(property);

            _propertyServiceMock.Setup(s => s.CreatePropertyAsync(property))
                .ReturnsAsync(property);

            _mapperMock.Setup(m => m.Map<PropertyDto>(property))
                .Returns(propertyDto);

            // Act
            var result = await _controller.CreateProperty(createDto);

            // Assert
            result.Should().BeOfType<CreatedAtActionResult>();
            var response = (result as CreatedAtActionResult).Value as PropertyDto;
            response.PropertyId.Should().Be(1);
        }

        [Fact]
        public async Task UpdateProperty_UnauthorizedUser_ReturnsForbid()
        {
            // Arrange
            SetupAuthenticatedUser(2); // Not owner
            _propertyServiceMock.Setup(s => s.IsOwner(1, 2))
                .ReturnsAsync(false);

            // Act
            var result = await _controller.UpdateProperty(1, new UpdatePropertyDto());

            // Assert
            result.Should().BeOfType<ForbidResult>();
        }

        [Fact]
        public async Task SearchProperties_ValidQuery_ReturnsPaginatedResult()
        {
            // Arrange
            var properties = new List<Property>
            {
                new Property
                {
                    PropertyId = 1,
                    Address = "123 Main St",
                    City = "Sample City"
                }
            };
            var paginatedResult = new PaginatedResult<Property>(
                properties, // items
                properties.Count, // totalItems
                1,          // page
                10         // pageSize                
            );

            //_propertyServiceMock.Setup(s => s.SearchPropertiesAsync(
            //    It.IsAny<string>(), null, null, 1, 10, "RentAmount", "asc"))
            //    .ReturnsAsync(paginatedResult);

            _mapperMock.Setup(m => m.Map<IEnumerable<PropertyListDto>>(properties))
                .Returns(new List<PropertyListDto> { new() });

            // Act
            var result = await _controller.SearchProperties(new SearchPropertiesDto());

            // Assert
            result.Should().BeOfType<OkObjectResult>();
            var response = (result as OkObjectResult)?.Value as PaginatedResult<PropertyListDto>;
            response.Should().NotBeNull();
            response?.Items.Should().HaveCount(1);
            response?.TotalItems.Should().Be(1);
        }

        [Fact]
        public async Task UploadPropertyImages_ValidRequest_ReturnsImagePaths()
        {
            // Arrange
            SetupAuthenticatedUser(1);
            _propertyServiceMock.Setup(s => s.IsOwner(1, 1))
                .ReturnsAsync(true);

            var fileMock = new Mock<IFormFile>();
            fileMock.Setup(f => f.Length).Returns(100);

            _fileServiceMock.Setup(s => s.SaveImageAsync(It.IsAny<IFormFile>()))
                .ReturnsAsync("~/images/test.jpg");

            // Act
            var result = await _controller.UploadPropertyImages(1, new List<IFormFile> { fileMock.Object });

            // Assert
            result.Should().BeOfType<OkResult>();
            //var response = (result as OkResult)?.ToString();
            //response?.Should().Contain("~/images/test.jpg");
        }
    }
}
