using HouseRentAPI.DTOs;
using HouseRentAPI.Exceptions;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.Text.Json;

namespace HouseRentAPI.Middleware
{
    public class ExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ExceptionMiddleware> _logger;
        private readonly IHostEnvironment _env;

        public ExceptionMiddleware(
            RequestDelegate next,
            ILogger<ExceptionMiddleware> logger,
            IHostEnvironment env)
        {
            _next = next;
            _logger = logger;
            _env = env;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, ex.Message);
                await HandleExceptionAsync(context, ex);
            }
        }

        private async Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            context.Response.ContentType = "application/json";
            var response = new ErrorResponse(exception);

            switch (exception)
            {
                case AppException appEx:
                    context.Response.StatusCode = appEx.StatusCode;
                    response.StatusCode = appEx.StatusCode;
                    response.Details = appEx.Details;
                    break;

                case ValidationException valEx:
                    context.Response.StatusCode = StatusCodes.Status400BadRequest;
                    response.StatusCode = StatusCodes.Status400BadRequest;
                    response.Message = "Validation failed";
                    response.Errors = new Dictionary<string, string[]>
                    {
                        { "ValidationError", new[] { valEx.Message } }
                    };
                    break;

                case DbUpdateException dbEx:
                    context.Response.StatusCode = StatusCodes.Status400BadRequest;
                    response.StatusCode = StatusCodes.Status400BadRequest;
                    response.Message = "Database operation failed";
                    response.Details = dbEx.InnerException?.Message;
                    break;

                default:
                    context.Response.StatusCode = StatusCodes.Status500InternalServerError;
                    response.StatusCode = StatusCodes.Status500InternalServerError;
                    response.Message = "Internal server error";
                    break;
            }

            // Hide sensitive information in production
            if (_env.IsProduction())
            {
                response.StackTrace = null;
                if (response.StatusCode == StatusCodes.Status500InternalServerError)
                {
                    response.Message = "Internal server error";
                    response.Details = null;
                }
            }

            var options = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            };

            var json = JsonSerializer.Serialize(response, options);
            await context.Response.WriteAsync(json);
        }
    }
}
