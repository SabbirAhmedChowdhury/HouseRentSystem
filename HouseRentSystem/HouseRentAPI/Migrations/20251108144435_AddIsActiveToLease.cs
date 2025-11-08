using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HouseRentAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddIsActiveToLease : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "Leases",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "Leases");
        }
    }
}
