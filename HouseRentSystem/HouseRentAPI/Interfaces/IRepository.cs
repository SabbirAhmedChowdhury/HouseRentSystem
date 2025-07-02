using Microsoft.EntityFrameworkCore.Query;
using System.Linq.Expressions;

namespace HouseRentAPI.Interfaces
{
    public interface IRepository<T> where T : class
    {
        Task<T> GetByIdAsync(int id);
        Task<T> GetByIdAsync(Expression<Func<T, bool>> predicate, params Expression<Func<T, object>>[] includes);
        Task<IEnumerable<T>> GetAllAsync();
        Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate);
        Task AddAsync(T entity);
        Task AddRangeAsync(IEnumerable<T> entities);
        void Update(T entity);
        void Remove(T entity);
        void RemoveRange(IEnumerable<T> entities);
        Task<bool> AnyAsync(Expression<Func<T, bool>> predicate);
        Task<int> CountAsync(Expression<Func<T, bool>> predicate = null);
        Task<T> FirstOrDefaultAsync(Expression<Func<T, bool>> predicate, params Expression<Func<T, object>>[] includes);
        Task<IEnumerable<T>> FindAsync(
        Expression<Func<T, bool>> predicate,
        params Expression<Func<T, object>>[] includes);

        Task<IEnumerable<T>> FindAsync(
            Expression<Func<T, bool>> predicate,
            Func<IQueryable<T>, IOrderedQueryable<T>> orderBy = null,
            params Expression<Func<T, object>>[] includes);

        Task<T> FirstOrDefaultAsync(
        Expression<Func<T, bool>> predicate,
        Func<IQueryable<T>, IIncludableQueryable<T, object>> include = null);
        Task<IEnumerable<T>> FindAsync(
        Expression<Func<T, bool>> predicate,
        Func<IQueryable<T>, IQueryable<T>> includes = null);

        IQueryable<T> Queryable();
    }
}
