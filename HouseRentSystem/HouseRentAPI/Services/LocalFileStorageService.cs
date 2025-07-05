using HouseRentAPI.Exceptions;
using HouseRentAPI.Interfaces;

namespace HouseRentAPI.Services
{
    public class LocalFileStorageService : IFileStorageService
    {
        private readonly IWebHostEnvironment _env;
        private readonly IConfiguration _configuration;
        private readonly string _baseStoragePath;

        public LocalFileStorageService(IWebHostEnvironment env, IConfiguration configuration)
        {
            _env = env;
            _configuration = configuration;

            // Get base storage path from config or use default
            _baseStoragePath = _configuration["FileStorage:BasePath"] ?? Path.Combine(_env.ContentRootPath, "FileStorage");
        }

        public async Task<string> SaveFileAsync(IFormFile file, string folderPath)
        {
            // Validate file
            if (file == null || file.Length == 0)
                throw new ArgumentException("File is empty");

            // Create directory if it doesn't exist
            var fullFolderPath = Path.Combine(_baseStoragePath, folderPath);
            Directory.CreateDirectory(fullFolderPath);

            // Generate unique filename
            var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
            var filePath = Path.Combine(fullFolderPath, fileName);

            // Save file
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Return relative path for database storage
            return $"/FileStorage/{folderPath}/{fileName}";
        }

        public async Task DeleteFileAsync(string filePath)
        {
            if (string.IsNullOrEmpty(filePath)) return;

            // Convert relative path to physical path
            var physicalPath = ConvertToPhysicalPath(filePath);

            if (File.Exists(physicalPath))
            {
                File.Delete(physicalPath);
            }
        }

        public async Task<byte[]> GetFileBytesAsync(string filePath)
        {
            if (string.IsNullOrEmpty(filePath))
                return null;

            var physicalPath = ConvertToPhysicalPath(filePath);

            if (!File.Exists(physicalPath))
                return null;

            return await File.ReadAllBytesAsync(physicalPath);
        }

        private string ConvertToPhysicalPath(string relativePath)
        {
            // Remove leading slash if present
            var path = relativePath.TrimStart('/');

            // Convert to physical path
            return Path.Combine(_baseStoragePath, path);
        }

        // Optional: Create a URL for accessing the file
        public string GetFileUrl(string filePath)
        {
            if (string.IsNullOrEmpty(filePath)) return null;
            return $"{_configuration["BaseUrl"]}{filePath}";
        }

        private void ValidateFile(IFormFile file, string fileType)
        {
            // Check file size
            var maxSize = _configuration.GetValue<long>("FileStorage:MaxFileSizeMB") * 1024 * 1024;
            if (file.Length > maxSize)
                //throw new InvalidOperationException($"File size exceeds {_configuration["FileStorage:MaxFileSizeMB"]}MB limit");
                throw new BadRequestException($"File size exceeds {_configuration["FileStorage:MaxFileSizeMB"]}MB limit");

            // Check file extension
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            var allowedTypes = fileType switch
            {
                "image" => _configuration.GetSection("FileStorage:AllowedImageTypes").Get<string[]>(),
                "document" => _configuration.GetSection("FileStorage:AllowedDocumentTypes").Get<string[]>(),
                _ => throw new ArgumentException("Invalid file type")
            };

            if (allowedTypes == null || !allowedTypes.Contains(extension))
                //throw new InvalidOperationException($"Invalid file type. Allowed types: {string.Join(", ", allowedTypes)}");
                throw new BadRequestException($"Invalid file type. Allowed types: {string.Join(", ", allowedTypes)}");
        }

        public async Task<string> SaveImageAsync(IFormFile imageFile)
        {
            ValidateFile(imageFile, "image");
            return await SaveFileAsync(imageFile, "images");
        }

        public async Task<string> SaveDocumentAsync(IFormFile documentFile)
        {
            ValidateFile(documentFile, "document");
            return await SaveFileAsync(documentFile, "documents");
        }
    }
}