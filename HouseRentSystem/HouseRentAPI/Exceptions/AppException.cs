namespace HouseRentAPI.Exceptions
{
    public class AppException : Exception
    {
        public int StatusCode { get; }
        public string? Details { get; }

        public AppException(string message, int statusCode = 500, string? details = null)
            : base(message)
        {
            StatusCode = statusCode;
            Details = details;
        }
    }

    public class NotFoundException : AppException
    {
        public NotFoundException(string name, object key)
            : base($"Resource \"{name}\" ({key}) was not found", 404) { }
    }

    public class BadRequestException : AppException
    {
        public BadRequestException(string message, string? details = null)
            : base(message, 400, details) { }
    }

    public class ConflictException : AppException
    {
        public ConflictException(string message)
            : base(message, 409) { }
    }
}
