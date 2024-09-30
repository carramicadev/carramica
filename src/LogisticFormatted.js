import formatDate from "./formatter";

export function formatOrders(orders) {
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    // Helper function to get month name
    function getMonthName(date) {
        const d = new Date(date.seconds * 1000); // Convert Firestore timestamp
        return `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    }

    function getMonthDate(date) {
        const d = new Date(date.seconds * 1000); // Convert Firestore timestamp
        return `${d.getDay()}-${monthNames[d.getMonth()]}-${d.getFullYear()}`;
    }


    const groupedData = {};

    orders.forEach(order => {
        const monthName = getMonthName(order.createdAt);

        if (!groupedData[monthName]) {
            groupedData[monthName] = {};
        }

        order.orders.forEach(orderDetail => {
            const courier = orderDetail.kurir;

            if (!groupedData[monthName][courier]) {
                groupedData[monthName][courier] = {
                    totalOrder: 0,
                    totalOngkir: 0,
                    totalHargaProduk: 0
                };
            }

            groupedData[monthName][courier].totalOrder += 1;
            groupedData[monthName][courier].totalOngkir += orderDetail.ongkir;
            groupedData[monthName][courier].totalHargaProduk += order.totalHargaProduk;
            groupedData[monthName][courier].date = formatDate(order.createdAt.toDate());

        });
    });

    // Format into the desired structure
    const result = [];

    Object.keys(groupedData).forEach(month => {
        const rows = [];

        Object.keys(groupedData[month]).forEach(courier => {
            rows.push({
                date: groupedData[month][courier].date,
                [courier.toLowerCase()]: groupedData[month][courier]
            });
        });

        result.push({ month, rows });
    });

    return result;
}

// Example usage:

