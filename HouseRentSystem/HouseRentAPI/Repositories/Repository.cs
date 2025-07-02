using HouseRentAPI.Data;
using HouseRentAPI.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Query;
using System.Linq.Expressions;

namespace HouseRentAPI.Repositories
{
    public class Repository<T> : IRepository<T> where T : class
    {
        protected readonly HouseRentContext _context;
        protected readonly DbSet<T> _dbSet;

        public Repository(HouseRentContext context)
        {
            _context = context;
            _dbSet = context.Set<T>();
        }

        public async Task<T> GetByIdAsync(int id)
        {
            return await _dbSet.FindAsync(id);
        }

        public async Task<T> GetByIdAsync(Expression<Func<T, bool>> predicate, params Expression<Func<T, object>>[] includes)
        {
            IQueryable<T> query = _dbSet;

            if (includes != null)
            {
                query = includes.Aggregate(query, (current, include) => current.Include(include));
            }

            return await query.FirstOrDefaultAsync(predicate);
        }

        public async Task<IEnumerable<T>> GetAllAsync()
        {
            return await _dbSet.ToListAsync();
        }

        public async Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate)
        {
            return await _dbSet.Where(predicate).ToListAsync();
        }

        public async Task AddAsync(T entity)
        {
            await _dbSet.AddAsync(entity);
        }

        public async Task AddRangeAsync(IEnumerable<T> entities)
        {
            await _dbSet.AddRangeAsync(entities);
        }

        public void Update(T entity)
        {
            _dbSet.Update(entity);
        }

        public void Remove(T entity)
        {
            _dbSet.Remove(entity);
        }

        public void RemoveRange(IEnumerable<T> entities)
        {
            _dbSet.RemoveRange(entities);
        }

        public async Task<bool> AnyAsync(Expression<Func<T, bool>> predicate)
        {
            return await _dbSet.AnyAsync(predicate);
        }

        public async Task<int> CountAsync(Expression<Func<T, bool>> predicate = null)
        {
            return predicate == null
                ? await _dbSet.CountAsync()
                : await _dbSet.CountAsync(predicate);
        }

        public async Task<T> FirstOrDefaultAsync(Expression<Func<T, bool>> predicate, params Expression<Func<T, object>>[] includes)
        {
            IQueryable<T> query = _dbSet;

            if (includes != null)
            {
                query = includes.Aggregate(query, (current, include) => current.Include(include));
            }

            return await query.FirstOrDefaultAsync(predicate);
        }

        public async Task<IEnumerable<T>> FindAsync(
    Expression<Func<T, bool>> predicate,
    params Expression<Func<T, object>>[] includes)
        {
            return await FindAsync(predicate, null, includes);
        }

        public async Task<IEnumerable<T>> FindAsync(
            Expression<Func<T, bool>> predicate,
            Func<IQueryable<T>, IOrderedQueryable<T>> orderBy = null,
            params Expression<Func<T, object>>[] includes)
        {
            IQueryable<T> query = _dbSet;

            // Apply includes
            if (includes != null)
            {
                query = includes.Aggregate(query, (current, include) => current.Include(include));
            }

            // Apply predicate
            if (predicate != null)
            {
                query = query.Where(predicate);
            }

            // Apply ordering
            if (orderBy != null)
            {
                query = orderBy(query);
            }

            return await query.ToListAsync();
        }

        public async Task<T> FirstOrDefaultAsync(
    Expression<Func<T, bool>> predicate,
    Func<IQueryable<T>, IIncludableQueryable<T, object>> include = null)
        {
            IQueryable<T> query = _dbSet;

            if (include != null)
            {
                query = include(query);
            }

            return await query.FirstOrDefaultAsync(predicate);
        }

        public async Task<IEnumerable<T>> FindAsync(
        Expression<Func<T, bool>> predicate,
        Func<IQueryable<T>, IQueryable<T>> includes = null)
        {
            IQueryable<T> query = _dbSet;

            if (includes != null)
            {
                query = includes(query);
            }

            return await query.Where(predicate).ToListAsync();
        }
        public IQueryable<T> Queryable()
        {
            return _dbSet.AsQueryable();
        }
    }
}
