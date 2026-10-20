const express = require("express");
const cors = require("cors");
const path = require("path");
const db = require("./db");

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =====================================================
// SERVE FRONTEND
// =====================================================

// Your HTML/CSS/JS files are directly inside:
// EV-Charging-System/
// NOT inside frontend/

app.use(express.static(path.join(__dirname, "..")));

// HOME
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../index.html"));
});


// =====================================================
// CUSTOMER APIs
// =====================================================

// Get all customers
app.get("/api/customers", (req, res) => {

    const sql = "SELECT * FROM Customer ORDER BY CustomerID";

    db.query(sql, (err, results) => {

        if (err) {
            console.error(err);

            return res.status(500).json({
                error: "Failed to fetch customers"
            });
        }

        res.json(results);
    });
});


// Add customer
app.post("/api/customers", (req, res) => {

    const {
        CustomerName,
        Phone,
        Email,
        City
    } = req.body;

    if (!CustomerName) {
        return res.status(400).json({
            error: "Customer name is required"
        });
    }

    const sql = `
        INSERT INTO Customer
        (CustomerName, Phone, Email, City)
        VALUES (?, ?, ?, ?)
    `;

    db.query(
        sql,
        [CustomerName, Phone, Email, City],
        (err, result) => {

            if (err) {
                console.error(err);

                return res.status(500).json({
                    error: "Failed to add customer"
                });
            }

            res.json({
                message: "Customer added successfully",
                CustomerID: result.insertId
            });
        }
    );
});


// =====================================================
// VEHICLE APIs
// =====================================================

// Get all vehicles
app.get("/api/vehicles", (req, res) => {

    const sql = `
        SELECT
            v.*,
            c.CustomerName
        FROM Vehicle v
        JOIN Customer c
        ON v.CustomerID = c.CustomerID
        ORDER BY v.VehicleID
    `;

    db.query(sql, (err, results) => {

        if (err) {
            console.error(err);

            return res.status(500).json({
                error: "Failed to fetch vehicles"
            });
        }

        res.json(results);
    });
});


// Add vehicle
app.post("/api/vehicles", (req, res) => {

    const {
        CustomerID,
        VehicleNumber,
        Brand,
        Model,
        BatteryCapacity
    } = req.body;

    const sql = `
        INSERT INTO Vehicle
        (CustomerID, VehicleNumber, Brand, Model, BatteryCapacity)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            CustomerID,
            VehicleNumber,
            Brand,
            Model,
            BatteryCapacity
        ],
        (err, result) => {

            if (err) {
                console.error(err);

                return res.status(500).json({
                    error: "Failed to add vehicle"
                });
            }

            res.json({
                message: "Vehicle added successfully",
                VehicleID: result.insertId
            });
        }
    );
});


// =====================================================
// STATION APIs
// =====================================================

// Get all stations
app.get("/api/stations", (req, res) => {

    const sql = `
        SELECT *
        FROM Station
        ORDER BY StationID
    `;

    db.query(sql, (err, results) => {

        if (err) {
            console.error(err);

            return res.status(500).json({
                error: "Failed to fetch stations"
            });
        }

        res.json(results);
    });
});


// =====================================================
// CHARGING POINT APIs
// =====================================================

// Get all charging points
app.get("/api/charging-points", (req, res) => {

    const sql = `
        SELECT
            cp.*,
            s.StationName,
            s.City
        FROM ChargingPoint cp
        JOIN Station s
        ON cp.StationID = s.StationID
        ORDER BY cp.PointID
    `;

    db.query(sql, (err, results) => {

        if (err) {
            console.error(err);

            return res.status(500).json({
                error: "Failed to fetch charging points"
            });
        }

        res.json(results);
    });
});


// Get charging points for a particular station
app.get("/api/stations/:id/points", (req, res) => {

    const stationID = req.params.id;

    const sql = `
        SELECT *
        FROM ChargingPoint
        WHERE StationID = ?
        ORDER BY PointID
    `;

    db.query(sql, [stationID], (err, results) => {

        if (err) {
            console.error(err);

            return res.status(500).json({
                error: "Failed to fetch charging points"
            });
        }

        res.json(results);
    });
});


// =====================================================
// BOOKING APIs
// =====================================================

// Get all bookings
app.get("/api/bookings", (req, res) => {

    const sql = `
        SELECT
            b.BookingID,
            b.CustomerID,
            c.CustomerName,
            b.VehicleID,
            v.VehicleNumber,
            v.Brand,
            v.Model,
            b.PointID,
            cp.PointNumber,
            s.StationName,
            b.BookingDate,
            b.StartTime,
            b.EndTime,
            b.BookingStatus

        FROM Booking b

        JOIN Customer c
        ON b.CustomerID = c.CustomerID

        JOIN Vehicle v
        ON b.VehicleID = v.VehicleID

        JOIN ChargingPoint cp
        ON b.PointID = cp.PointID

        JOIN Station s
        ON cp.StationID = s.StationID

        ORDER BY b.BookingID DESC
    `;

    db.query(sql, (err, results) => {

        if (err) {
            console.error(err);

            return res.status(500).json({
                error: "Failed to fetch bookings"
            });
        }

        res.json(results);
    });
});


// Create booking
app.post("/api/bookings", (req, res) => {

    const {
        CustomerID,
        VehicleID,
        PointID,
        BookingDate,
        StartTime,
        EndTime
    } = req.body;

    if (
        !CustomerID ||
        !VehicleID ||
        !PointID ||
        !BookingDate ||
        !StartTime ||
        !EndTime
    ) {
        return res.status(400).json({
            error: "All booking fields are required"
        });
    }

    const sql = `
        INSERT INTO Booking
        (
            CustomerID,
            VehicleID,
            PointID,
            BookingDate,
            StartTime,
            EndTime,
            BookingStatus
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            CustomerID,
            VehicleID,
            PointID,
            BookingDate,
            StartTime,
            EndTime,
            "Confirmed"
        ],
        (err, result) => {

            if (err) {
                console.error(err);

                return res.status(500).json({
                    error: "Failed to create booking"
                });
            }

            res.json({
                message: "Booking created successfully",
                BookingID: result.insertId
            });
        }
    );
});


// =====================================================
// CHARGING SESSION APIs
// =====================================================

// Get charging sessions
app.get("/api/sessions", (req, res) => {

    const sql = `
        SELECT
            cs.SessionID,
            cs.BookingID,
            c.CustomerName,
            cs.StartTime,
            cs.EndTime,
            cs.EnergyConsumed,
            cs.Amount

        FROM ChargingSession cs

        JOIN Booking b
        ON cs.BookingID = b.BookingID

        JOIN Customer c
        ON b.CustomerID = c.CustomerID

        ORDER BY cs.SessionID DESC
    `;

    db.query(sql, (err, results) => {

        if (err) {
            console.error(err);

            return res.status(500).json({
                error: "Failed to fetch sessions"
            });
        }

        res.json(results);
    });
});


// Create charging session
app.post("/api/sessions", (req, res) => {

    const {
        BookingID,
        StartTime,
        EndTime,
        EnergyConsumed,
        Amount
    } = req.body;

    const sql = `
        INSERT INTO ChargingSession
        (
            BookingID,
            StartTime,
            EndTime,
            EnergyConsumed,
            Amount
        )
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            BookingID,
            StartTime,
            EndTime,
            EnergyConsumed,
            Amount
        ],
        (err, result) => {

            if (err) {
                console.error(err);

                return res.status(500).json({
                    error: "Failed to create charging session"
                });
            }

            res.json({
                message: "Charging session created successfully",
                SessionID: result.insertId
            });
        }
    );
});


// =====================================================
// PAYMENT APIs
// =====================================================

// Get all payments
app.get("/api/payments", (req, res) => {

    const sql = `
        SELECT
            p.PaymentID,
            p.SessionID,
            p.PaymentDate,
            p.Amount,
            p.PaymentMethod,
            p.PaymentStatus,
            c.CustomerName

        FROM Payment p

        JOIN ChargingSession cs
        ON p.SessionID = cs.SessionID

        JOIN Booking b
        ON cs.BookingID = b.BookingID

        JOIN Customer c
        ON b.CustomerID = c.CustomerID

        ORDER BY p.PaymentID DESC
    `;

    db.query(sql, (err, results) => {

        if (err) {
            console.error(err);

            return res.status(500).json({
                error: "Failed to fetch payments"
            });
        }

        res.json(results);
    });
});


// Add payment
app.post("/api/payments", (req, res) => {

    const {
        SessionID,
        PaymentDate,
        Amount,
        PaymentMethod
    } = req.body;

    const sql = `
        INSERT INTO Payment
        (
            SessionID,
            PaymentDate,
            Amount,
            PaymentMethod,
            PaymentStatus
        )
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            SessionID,
            PaymentDate,
            Amount,
            PaymentMethod,
            "Paid"
        ],
        (err, result) => {

            if (err) {
                console.error(err);

                return res.status(500).json({
                    error: "Failed to process payment"
                });
            }

            res.json({
                message: "Payment successful",
                PaymentID: result.insertId
            });
        }
    );
});


// =====================================================
// DASHBOARD API
// =====================================================

app.get("/api/dashboard", (req, res) => {

    const queries = {

        customers: `
            SELECT COUNT(*) AS count
            FROM Customer
        `,

        vehicles: `
            SELECT COUNT(*) AS count
            FROM Vehicle
        `,

        stations: `
            SELECT COUNT(*) AS count
            FROM Station
        `,

        chargingPoints: `
            SELECT COUNT(*) AS count
            FROM ChargingPoint
        `,

        bookings: `
            SELECT COUNT(*) AS count
            FROM Booking
        `,

        revenue: `
            SELECT COALESCE(SUM(Amount), 0) AS total
            FROM Payment
            WHERE PaymentStatus = 'Paid'
        `
    };


    db.query(queries.customers, (err, customerResult) => {

        if (err) {
            return res.status(500).json(err);
        }

        db.query(queries.vehicles, (err, vehicleResult) => {

            if (err) {
                return res.status(500).json(err);
            }

            db.query(queries.stations, (err, stationResult) => {

                if (err) {
                    return res.status(500).json(err);
                }

                db.query(
                    queries.chargingPoints,
                    (err, pointResult) => {

                        if (err) {
                            return res.status(500).json(err);
                        }

                        db.query(
                            queries.bookings,
                            (err, bookingResult) => {

                                if (err) {
                                    return res.status(500).json(err);
                                }

                                db.query(
                                    queries.revenue,
                                    (err, revenueResult) => {

                                        if (err) {
                                            return res.status(500).json(err);
                                        }

                                        res.json({
                                            customers: customerResult[0].count,
                                            vehicles: vehicleResult[0].count,
                                            stations: stationResult[0].count,
                                            chargingPoints: pointResult[0].count,
                                            bookings: bookingResult[0].count,
                                            revenue: revenueResult[0].total
                                        });

                                    }
                                );
                            }
                        );
                    }
                );
            });
        });
    });
});


// =====================================================
// UPDATE BOOKING STATUS
// =====================================================

app.put("/api/bookings/:id/status", (req, res) => {

    const bookingID = req.params.id;

    const {
        status
    } = req.body;

    const sql = `
        UPDATE Booking
        SET BookingStatus = ?
        WHERE BookingID = ?
    `;

    db.query(
        sql,
        [status, bookingID],
        (err, result) => {

            if (err) {
                console.error(err);

                return res.status(500).json({
                    error: "Failed to update booking"
                });
            }

            res.json({
                message: "Booking status updated successfully"
            });
        }
    );
});


// =====================================================
// START SERVER
// =====================================================

app.listen(PORT, () => {

    console.log("------------------------------------");
    console.log("🚗 EV Charging Station System");
    console.log("------------------------------------");
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log("------------------------------------");

});