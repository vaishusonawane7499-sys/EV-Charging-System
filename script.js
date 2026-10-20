// =====================================================
// EV CHARGING STATION MANAGEMENT SYSTEM
// MAIN FRONTEND JAVASCRIPT
// =====================================================

document.addEventListener("DOMContentLoaded", () => {

    console.log("EV Charging System started");

    loadDashboard();
    loadCustomers();
    loadVehicles();
    loadStations();
    loadBookings();
    loadPayments();

    setupCustomerForm();
    setupBookingForm();
    setupPayment();
});


// =====================================================
// HELPER
// =====================================================

function getElement(...ids) {

    for (const id of ids) {

        const element = document.getElementById(id);

        if (element) {
            return element;
        }
    }

    return null;
}


// =====================================================
// DASHBOARD
// =====================================================

async function loadDashboard() {

    const customerCount = getElement("customerCount");
    const vehicleCount = getElement("vehicleCount");
    const stationCount = getElement("stationCount");
    const pointCount = getElement("pointCount");
    const bookingCount = getElement("bookingCount");
    const revenue = getElement("revenue");

    try {

        const response = await fetch("/api/dashboard");

        if (!response.ok) {
            throw new Error("Dashboard API failed");
        }

        const data = await response.json();

        if (customerCount) {
            customerCount.textContent = data.customers ?? 0;
        }

        if (vehicleCount) {
            vehicleCount.textContent = data.vehicles ?? 0;
        }

        if (stationCount) {
            stationCount.textContent = data.stations ?? 0;
        }

        if (pointCount) {
            pointCount.textContent = data.chargingPoints ?? 0;
        }

        if (bookingCount) {
            bookingCount.textContent = data.bookings ?? 0;
        }

        if (revenue) {
            revenue.textContent =
                "₹" + Number(data.revenue || 0).toFixed(2);
        }

    } catch (error) {

        console.error("Dashboard error:", error);

    }
}


// =====================================================
// CUSTOMERS
// =====================================================


async function loadCustomers() {
    const table = getElement("customerTable");

    if (!table) {
        console.warn("Customer table element #customerTable was not found.");
        return;
    }

    table.innerHTML = `
        <tr>
            <td colspan="5" class="loading">Loading customers...</td>
        </tr>
    `;

    try {
        const response = await fetch("/api/customers", {
            method: "GET",
            headers: {
                "Accept": "application/json"
            },
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error(`Customer API returned HTTP ${response.status}`);
        }

        const customers = await response.json();

        if (!Array.isArray(customers)) {
            throw new Error("The customer API did not return a list.");
        }

        table.replaceChildren();

        if (customers.length === 0) {
            table.innerHTML = `
                <tr>
                    <td colspan="5" class="loading">
                        No customers found.
                    </td>
                </tr>
            `;
            return;
        }

        customers.forEach(customer => {
            const row = document.createElement("tr");

            // Use textContent to display database values safely.
            [
                customer.CustomerID,
                customer.CustomerName,
                customer.Phone || "-",
                customer.Email || "-",
                customer.City || "-"
            ].forEach(value => {
                const cell = document.createElement("td");
                cell.textContent = value ?? "-";
                row.appendChild(cell);
            });

            table.appendChild(row);
        });

        console.log(`Successfully loaded ${customers.length} customers.`);
    } catch (error) {
        console.error("Customer loading error:", error);

        table.innerHTML = `
            <tr>
                <td colspan="5" class="loading">
                    Unable to load customers. Please refresh the page.
                </td>
            </tr>
        `;
    }
}



// =====================================================
// CUSTOMER FORM
// =====================================================


function setupCustomerForm() {
    const form = getElement("customerForm");

    if (!form) {
        return;
    }

    // Prevent duplicate event listeners if setup runs more than once.
    if (form.dataset.initialized === "true") {
        return;
    }
    form.dataset.initialized = "true";

    const name = getElement("customerName");
    const phone = getElement("customerPhone");
    const email = getElement("customerEmail");
    const city = getElement("customerCity");
    const message = getElement("customerMessage");

    if (!name || !phone || !email || !city || !message) {
        console.error("Customer form fields are missing.");
        return;
    }

    // Show messages consistently.
    function showMessage(text, success = false) {
        message.textContent = text;
        message.style.color = success ? "#087b60" : "#b42318";
    }

    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        const trimmedName = name.value.trim();
        const trimmedPhone = phone.value.replace(/\s+/g, "").trim();
        const trimmedEmail = email.value.trim();
        const trimmedCity = city.value.trim();

        // Validate customer name.
        if (trimmedName.length < 2 || trimmedName.length > 50) {
            showMessage("❌ Name must be between 2 and 50 characters.");
            name.focus();
            return;
        }

        // Validate a 10-digit Indian mobile number.
        if (!/^[0-9]{10}$/.test(trimmedPhone)) {
            showMessage(
                "❌ Enter exactly 10 digits without +91, spaces, or symbols."
            );
            phone.focus();
            return;
        }

        // Validate email.
        if (
            trimmedEmail.length > 100 ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)
        ) {
            showMessage("❌ Please enter a valid email address.");
            email.focus();
            return;
        }

        // Validate city.
        if (trimmedCity.length < 2 || trimmedCity.length > 50) {
            showMessage("❌ City must be between 2 and 50 characters.");
            city.focus();
            return;
        }

        const submitButton = form.querySelector('button[type="submit"]');

        try {
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = "Adding Customer...";
            }

            const response = await fetch("/api/customers", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    CustomerName: trimmedName,
                    Phone: trimmedPhone,
                    Email: trimmedEmail,
                    City: trimmedCity
                })
            });

            // Handle responses that aren't valid JSON.
            let result;
            try {
                result = await response.json();
            } catch {
                throw new Error("The server returned an invalid response.");
            }

            if (!response.ok) {
                throw new Error(
                    result.error || "Customer could not be added."
                );
            }

            showMessage("✅ Customer added successfully.", true);
            form.reset();

            // Refresh the customer table and dashboard.
            if (typeof loadCustomers === "function") {
                await loadCustomers();
            }

            if (typeof loadDashboard === "function") {
                await loadDashboard();
            }
        } catch (error) {
            console.error("Add customer error:", error);
            showMessage("❌ " + error.message);
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = "+ Add Customer";
            }
        }
    });
}



// =====================================================
// VEHICLES
// =====================================================

async function loadVehicles() {

    const table = getElement(
        "vehicleTable",
        "vehicleTableBody",
        "vehiclesTableBody"
    );

    if (!table) {
        return;
    }

    try {

        const response = await fetch("/api/vehicles");

        if (!response.ok) {
            throw new Error("Vehicle API failed");
        }

        const vehicles = await response.json();

        table.innerHTML = "";

        vehicles.forEach(vehicle => {

            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${vehicle.VehicleID}</td>
                <td>${vehicle.CustomerName || vehicle.CustomerID}</td>
                <td>${vehicle.VehicleNumber}</td>
                <td>${vehicle.Brand || "-"}</td>
                <td>${vehicle.Model || "-"}</td>
                <td>${vehicle.BatteryCapacity || "-"} kWh</td>
            `;

            table.appendChild(row);

        });

    } catch (error) {

        console.error("Vehicle loading error:", error);

    }
}


// =====================================================
// STATIONS
// =====================================================

async function loadStations() {

    const container = getElement("stationsContainer");

    if (!container) {
        return;
    }

    try {

        const response = await fetch("/api/stations");

        if (!response.ok) {
            throw new Error("Station API failed");
        }

        const stations = await response.json();

        container.innerHTML = "";

        if (stations.length === 0) {

            container.innerHTML = `
                <div class="loading-card">
                    No charging stations found.
                </div>
            `;

            return;
        }

        stations.forEach(station => {

            const card = document.createElement("div");

            card.className = "station-card";

            card.innerHTML = `

                <div class="feature-icon">⚡</div>

                <h2>
                    ${station.StationName}
                </h2>

                <p>
                    📍 ${station.Location}
                </p>

                <p>
                    🏙️ ${station.City}
                </p>

                <p>
                    🔌 Charging Points:
                    <strong>
                        ${station.TotalPoints}
                    </strong>
                </p>

                <button
                    type="button"
                    onclick="showChargingPoints(
                        ${station.StationID},
                        '${String(station.StationName).replace(/'/g, "\\'")}'
                    )"
                >
                    View Charging Points
                </button>

            `;

            container.appendChild(card);

        });

    } catch (error) {

        console.error("Station loading error:", error);

        container.innerHTML = `
            <div class="loading-card">
                Unable to load stations.
            </div>
        `;
    }
}


// =====================================================
// CHARGING POINTS
// =====================================================

async function showChargingPoints(stationID, stationName) {

    try {

        const response =
            await fetch(`/api/stations/${stationID}/points`);

        if (!response.ok) {
            throw new Error("Charging point API failed");
        }

        const points = await response.json();

        let existing =
            document.getElementById("chargingPointsResult");

        if (!existing) {

            existing = document.createElement("div");

            existing.id = "chargingPointsResult";

            existing.className = "form-card";

            document
                .querySelector("main")
                .appendChild(existing);
        }

        let html = `

            <div class="section-title left">

                <p class="small-title">
                    CHARGING POINTS
                </p>

                <h2>
                    ${stationName}
                </h2>

            </div>

            <div class="feature-grid">
        `;

        if (points.length === 0) {

            html += `
                <p>
                    No charging points found.
                </p>
            `;

        } else {

            points.forEach(point => {

                html += `

                    <div class="feature-card">

                        <div class="feature-icon">
                            🔌
                        </div>

                        <h3>
                            Point ${point.PointNumber}
                        </h3>

                        <p>
                            Charger:
                            ${point.ChargerType}
                        </p>

                        <p>
                            Power:
                            ${point.PowerKW} kW
                        </p>

                        <p>
                            Status:
                            <strong>
                                ${point.Status}
                            </strong>
                        </p>

                    </div>

                `;
            });
        }

        html += `</div>`;

        existing.innerHTML = html;

        existing.scrollIntoView({
            behavior: "smooth"
        });

    } catch (error) {

        console.error(error);

        alert("Unable to load charging points.");
    }
}


// =====================================================
// BOOKINGS
// =====================================================

async function loadBookings() {

    // IMPORTANT:
    // Your dashboard uses recentBookings
    // Your booking page uses bookingTable

    const table = getElement(
        "recentBookings",
        "bookingTable"
    );

    if (!table) {
        return;
    }

    try {

        const response =
            await fetch("/api/bookings");

        if (!response.ok) {
            throw new Error("Booking API failed");
        }

        const bookings = await response.json();

        table.innerHTML = "";

        if (bookings.length === 0) {

            const colspan =
                table.id === "recentBookings" ? 6 : 6;

            table.innerHTML = `
                <tr>
                    <td colspan="${colspan}" class="loading">
                        No bookings found.
                    </td>
                </tr>
            `;

            return;
        }

        // Dashboard table
        if (table.id === "recentBookings") {

            bookings.forEach(booking => {

                const row = document.createElement("tr");

                row.innerHTML = `

                    <td>
                        #${booking.BookingID}
                    </td>

                    <td>
                        ${booking.CustomerName || booking.CustomerID}
                    </td>

                    <td>
                        ${booking.VehicleNumber || booking.VehicleID}
                    </td>

                    <td>
                        ${booking.StationName || booking.PointNumber || "-"}
                    </td>

                    <td>
                        ${formatDate(booking.BookingDate)}
                    </td>

                    <td>
                        <span class="status">
                            ${booking.BookingStatus || "Confirmed"}
                        </span>
                    </td>

                `;

                table.appendChild(row);

            });

        }

        // Booking page table
        else {

            bookings.forEach(booking => {

                const row = document.createElement("tr");

                row.innerHTML = `

                    <td>
                        #${booking.BookingID}
                    </td>

                    <td>
                        ${booking.CustomerName || booking.CustomerID}
                    </td>

                    <td>
                        ${booking.VehicleNumber || booking.VehicleID}
                    </td>

                    <td>
                        ${booking.PointNumber || booking.PointID}
                    </td>

                    <td>
                        ${formatDate(booking.BookingDate)}
                    </td>

                    <td>
                        <span class="status">
                            ${booking.BookingStatus || "Confirmed"}
                        </span>
                    </td>

                `;

                table.appendChild(row);

            });
        }

    } catch (error) {

        console.error("Booking loading error:", error);

        table.innerHTML = `
            <tr>
                <td colspan="6" class="loading">
                    Unable to load bookings.
                </td>
            </tr>
        `;
    }
}


// =====================================================
// BOOKING FORM
// =====================================================

async function setupBookingForm() {

    const form = getElement("bookingForm");

    if (!form) {
        return;
    }

    await loadBookingCustomers();
    await loadBookingVehicles();

    form.addEventListener("submit", async event => {

        event.preventDefault();

        const message =
            getElement("bookingMessage");

        try {

            const response = await fetch("/api/bookings", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    CustomerID:
                        Number(
                            getElement("bookingCustomer").value
                        ),

                    VehicleID:
                        Number(
                            getElement("bookingVehicle").value
                        ),

                    PointID:
                        Number(
                            getElement("bookingPoint").value
                        ),

                    BookingDate:
                        getElement("bookingDate").value,

                    StartTime:
                        getElement("startTime").value,

                    EndTime:
                        getElement("endTime").value,

                    BookingStatus:
                        "Confirmed"

                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.error || "Booking failed"
                );
            }

            message.textContent =
                "✅ Booking created successfully.";

            message.style.color = "#087b60";

            form.reset();

            await loadBookings();
            await loadDashboard();

        } catch (error) {

            console.error(error);

            message.textContent =
                "❌ " + error.message;

            message.style.color = "#b42318";
        }

    });
}


// =====================================================
// BOOKING CUSTOMER DROPDOWN
// =====================================================

async function loadBookingCustomers() {

    const select =
        getElement("bookingCustomer");

    if (!select) {
        return;
    }

    try {

        const response =
            await fetch("/api/customers");

        const customers =
            await response.json();

        select.innerHTML =
            `<option value="">Select Customer</option>`;

        customers.forEach(customer => {

            const option =
                document.createElement("option");

            option.value =
                customer.CustomerID;

            option.textContent =
                customer.CustomerName;

            select.appendChild(option);

        });

    } catch (error) {

        console.error(
            "Customer dropdown error:",
            error
        );
    }
}


// =====================================================
// BOOKING VEHICLE DROPDOWN
// =====================================================

async function loadBookingVehicles() {

    const select =
        getElement("bookingVehicle");

    if (!select) {
        return;
    }

    try {

        const response =
            await fetch("/api/vehicles");

        const vehicles =
            await response.json();

        select.innerHTML =
            `<option value="">Select Vehicle</option>`;

        vehicles.forEach(vehicle => {

            const option =
                document.createElement("option");

            option.value =
                vehicle.VehicleID;

            option.textContent =
                vehicle.VehicleNumber;

            select.appendChild(option);

        });

        // Load charging points
        // from all stations

        await loadBookingPoints();

    } catch (error) {

        console.error(
            "Vehicle dropdown error:",
            error
        );
    }
}


// =====================================================
// BOOKING POINT DROPDOWN
// =====================================================

async function loadBookingPoints() {

    const select =
        getElement("bookingPoint");

    if (!select) {
        return;
    }

    try {

        const response =
            await fetch("/api/stations");

        const stations =
            await response.json();

        select.innerHTML =
            `<option value="">Select Charging Point</option>`;

        for (const station of stations) {

            const pointResponse =
                await fetch(
                    `/api/stations/${station.StationID}/points`
                );

            const points =
                await pointResponse.json();

            points.forEach(point => {

                const option =
                    document.createElement("option");

                option.value =
                    point.PointID;

                option.textContent =
                    `${station.StationName} - Point ${point.PointNumber}`;

                select.appendChild(option);

            });
        }

    } catch (error) {

        console.error(
            "Charging point dropdown error:",
            error
        );
    }
}


// =====================================================
// PAYMENTS
// =====================================================

async function loadPayments() {

    const table = getElement(
        "paymentTable",
        "paymentTableBody",
        "paymentsTableBody"
    );

    if (!table) {
        return;
    }

    try {

        const response =
            await fetch("/api/payments");

        if (!response.ok) {
            throw new Error("Payment API failed");
        }

        const payments =
            await response.json();

        table.innerHTML = "";

        payments.forEach(payment => {

            const row =
                document.createElement("tr");

            row.innerHTML = `

                <td>
                    #${payment.PaymentID}
                </td>

                <td>
                    #${payment.SessionID}
                </td>

                <td>
                    ${formatDate(payment.PaymentDate)}
                </td>

                <td>
                    ₹${Number(
                        payment.Amount || 0
                    ).toFixed(2)}
                </td>

                <td>
                    ${payment.PaymentMethod || "-"}
                </td>

                <td>
                    <span class="status paid">
                        ${payment.PaymentStatus || "Paid"}
                    </span>
                </td>

            `;

            table.appendChild(row);

        });

    } catch (error) {

        console.error(
            "Payment loading error:",
            error
        );
    }
}


// =====================================================
// PAYMENT
// =====================================================

function setupPayment() {

    const button =
        getElement("payButton");

    if (!button) {
        return;
    }

    button.addEventListener(
        "click",
        async () => {

            const sessionInput =
                getElement("sessionId");

            const amountInput =
                getElement("amount");

            const methodInput =
                getElement("paymentMethod");

            const successMessage =
                getElement("successMessage");

            const sessionID =
                Number(sessionInput?.value);

            const amount =
                Number(amountInput?.value);

            const paymentMethod =
                methodInput?.value;

            if (!sessionID) {

                alert("Please enter Session ID.");

                return;
            }

            if (!amount || amount <= 0) {

                alert("Please enter a valid amount.");

                return;
            }

            try {

                button.disabled = true;

                button.textContent =
                    "Processing...";

                const response =
                    await fetch(
                        "/api/payments",
                        {

                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({

                                SessionID:
                                    sessionID,

                                PaymentDate:
                                    new Date()
                                        .toISOString()
                                        .split("T")[0],

                                Amount:
                                    amount,

                                PaymentMethod:
                                    paymentMethod

                            })
                        }
                    );

                const result =
                    await response.json();

                if (!response.ok) {

                    throw new Error(
                        result.error ||
                        "Payment failed"
                    );
                }

                if (successMessage) {

                    successMessage.style.display =
                        "block";

                    successMessage.innerHTML = `

                        ✅ Payment Successful!

                        <br><br>

                        Payment ID:
                        #${result.PaymentID}

                        <br>

                        Amount:
                        ₹${amount.toFixed(2)}

                        <br>

                        Method:
                        ${paymentMethod}

                    `;

                } else {

                    alert(
                        "Payment successful!"
                    );
                }

                await loadPayments();

                await loadDashboard();

            } catch (error) {

                console.error(
                    "Payment error:",
                    error
                );

                alert(
                    "Payment failed: " +
                    error.message
                );

            } finally {

                button.disabled = false;

                button.textContent =
                    "Pay Now";
            }

        }
    );
}


// =====================================================
// DATE FORMAT
// =====================================================

function formatDate(dateValue) {

    if (!dateValue) {
        return "-";
    }

    try {

        const date =
            new Date(dateValue);

        if (isNaN(date.getTime())) {
            return dateValue;
        }

        return date.toLocaleDateString("en-IN");

    } catch {

        return dateValue;
    }
}


// =====================================================
// REFRESH DASHBOARD DATA
// =====================================================

setInterval(() => {

    loadDashboard();
    loadCustomers();
    loadVehicles();
    loadStations();
    loadBookings();
    loadPayments();

}, 30000);