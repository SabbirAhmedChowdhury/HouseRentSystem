using HouseRentAPI.Data;
using HouseRentAPI.Interfaces;
using Microsoft.EntityFrameworkCore.Storage;

namespace HouseRentAPI.Repositories
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly HouseRentContext _context;
        private IDbContextTransaction _transaction;
        private readonly Dictionary<Type, object> _repositories = new();

        public UnitOfWork(HouseRentContext context)
        {
            _context = context;
        }

        public IRepository<T> GetRepository<T>() where T : class
        {
            if (_repositories.ContainsKey(typeof(T)))
            {
                return (IRepository<T>)_repositories[typeof(T)];
            }

            var repository = new Repository<T>(_context);
            _repositories.Add(typeof(T), repository);
            return repository;
        }

        public async Task<int> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync();
        }

        public async Task BeginTransactionAsync()
        {
            _transaction = await _context.Database.BeginTransactionAsync();
        }

        public async Task CommitAsync()
        {
            try
            {
                await _transaction.CommitAsync();
            }
            catch
            {
                await RollbackAsync();
                throw;
            }
            finally
            {
                _transaction?.Dispose();
            }
        }

        public async Task RollbackAsync()
        {
            await _transaction.RollbackAsync();
            _transaction?.Dispose();
        }

        public void Dispose()
        {
            _transaction?.Dispose();
            _context.Dispose();
            GC.SuppressFinalize(this);
        }
    }

}
