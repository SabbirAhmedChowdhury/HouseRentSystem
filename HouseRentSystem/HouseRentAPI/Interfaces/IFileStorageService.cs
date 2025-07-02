namespace HouseRentAPI.Interfaces
{
    public interface IFileStorageService
    {
        Task<string> SaveImageAsync(IFormFile imageFile);
        Task<string> SaveDocumentAsync(IFormFile documentFile);
        Task<string> SaveFileAsync(IFormFile file, string folderPath);
        Task DeleteFileAsync(string filePath);
        Task<byte[]> GetFileBytesAsync(string filePath);
    }
}
