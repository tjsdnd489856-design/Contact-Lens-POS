# Blueprint: Store Management System

## 1. Project Overview

This document outlines the development plan for the "Store Management System" application. It's a web-based Point of Sale (POS) system designed specifically for contact lens stores. The goal is to create a modern, intuitive, and efficient application for managing sales, customers, products, and inventory.

---

## 2. Application Blueprint: Features & Design

This section details all implemented features, design choices, and styling. It will be updated as the application evolves.

### Core Features:
- **Inventory Management:** Add, edit, and view contact lens products (brand, model, power, price, stock, etc.).
- **Customer Management:** Manage customer information, including personal details (name, phone), prescription (right/left eye power), last purchase date, purchase history, and notes.
- **Sales & Ordering:** Create and manage customer orders.
- **Inventory Tracking:** Automatically track product stock levels.

### Design & Style:
- **UI:** Modern, clean, and responsive interface using Web Components.
- **Styling:** Adherence to modern CSS practices for a visually appealing and maintainable design.
- **Accessibility:** Implementation of a11y standards to ensure the application is usable by everyone.

### UDI Barcode Scanning
- **HID (USB) Barcode Scanner Input:** The camera-based `html5-qrcode` integration has been replaced with a dedicated text input field in the sales transaction screen. This field is designed to work with traditional USB barcode scanners that emulate keyboard input. When a barcode is scanned, the data is "typed" into this field, and an Enter keypress triggers the UDI parsing and product lookup.
- **Robust UDI Parsing:** Implemented a sophisticated UDI parser (`udi-parser.js`) that can extract GTIN, expiration date, lot number, and serial number from a GS1-128 barcode string. It includes logic to handle common challenges like 2-digit year ambiguity.
- **Seamless Sales Workflow:** An input field for USB barcode scanners has been added to the sales transaction screen. On a successful scan, the system automatically parses the UDI, looks up the product by its GTIN in the `ProductService`, and adds it to the cart.
- **Data Consistency:** Updated the product data model and forms to include a `gtin` field, ensuring that products can be reliably looked up via their GTIN. New products have their GTIN automatically generated from their barcode.

### External API Integration with Firebase Functions
- **Purpose:** To securely access external public APIs (e.g., `data.go.kr` for medical device information) to retrieve detailed product information that might not be available locally.
- **Architecture:** Firebase Cloud Functions are used as a secure proxy layer. Client-side requests are sent to a Firebase Function, which then makes the actual call to the external API, processes the response, and returns the relevant data to the client. This prevents exposing API keys directly on the client.
- **Security:** External API keys are stored securely in Firebase Functions environment variables (`functions.config()`), ensuring they are not hardcoded or exposed in client-side code or version control.
- **Product Enrichment:** When a product is scanned via UDI but not found locally, the system attempts to fetch its details from the external medical device API via the Firebase Function. If successful, the product is added to the local inventory for future use.

---

## 3. Current Development Plan

This section outlines the tasks for the current development cycle.

### UDI Barcode Feature Implementation (Phase 1: Client-Side Scanning & Parsing)

1.  **COMPLETED:** Improve `udi-parser.js` to handle date ambiguity and improve regex robustness.
2.  **COMPLETED:** Integrate `html5-qrcode` library for barcode scanning.
3.  **COMPLETED:** Implement barcode scanning UI and logic in `sale-transaction.component.js`.
4.  **COMPLETED:** Update `product.service.js` and `product-form.component.js` to support product lookup by GTIN.
5.  **COMPLETED:** Update `blueprint.md` with the new implementation plan for Phase 1.

### UDI Barcode Feature Implementation (Phase 2: External API Integration)

1.  **COMPLETED:** Set up Firebase Function environment and configure API key.
2.  **COMPLETED:** Create Firebase Function to fetch medical device details from `data.go.kr` API.
3.  **COMPLETED:** Modify `ProductService` to call the Firebase Function.
4.  **COMPLETED:** Modify `sale-transaction.component.js` to use the updated `ProductService` for external API lookup.
5.  **COMPLETED:** Update `blueprint.md` with the new API integration details for Phase 2.