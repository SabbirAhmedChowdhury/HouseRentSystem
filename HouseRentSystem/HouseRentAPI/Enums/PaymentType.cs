namespace HouseRentAPI.Enums
{
    /// <summary>
    /// Enumeration for different types of payments in the system
    /// </summary>
    public enum PaymentType
    {
        /// <summary>
        /// Monthly rent payment
        /// </summary>
        Rent = 1,
        
        /// <summary>
        /// Security deposit payment (one-time, typically paid at lease start)
        /// </summary>
        SecurityDeposit = 2
    }
}

