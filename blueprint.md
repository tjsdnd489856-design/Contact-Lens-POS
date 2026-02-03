# Blueprint: Contact Lens POS

## 1. Project Overview

This document outlines the development plan for the "Contact Lens POS" application. It's a web-based Point of Sale (POS) system designed specifically for contact lens stores. The goal is to create a modern, intuitive, and efficient application for managing sales, customers, products, and inventory.

---

## 2. Application Blueprint: Features & Design

This section details all implemented features, design choices, and styling. It will be updated as the application evolves.

### Core Features:
- **Product Management:** Add, edit, and view contact lens products (brand, model, power, price, stock, etc.).
- **Customer Management:** Manage customer information, including personal details (name, phone), prescription (right/left eye power), last purchase date, purchase history, and notes.
- **Sales & Ordering:** Create and manage customer orders.
- **Inventory Tracking:** Automatically track product stock levels.

### Design & Style:
- **UI:** Modern, clean, and responsive interface using Web Components.
- **Styling:** Adherence to modern CSS practices for a visually appealing and maintainable design.
- **Accessibility:** Implementation of a11y standards to ensure the application is usable by everyone.

---

## 3. Current Development Plan

This section outlines the immediate tasks for the current development cycle.

### Initial Setup & Core Feature Implementation

1.  **DONE:** Set up the project environment and Git repository.
2.  **DONE:** Create the basic HTML structure (`index.html`) for the main application layout.
3.  **DONE:** Style the main layout (`style.css`) with a modern and clean design, including a header, main content area, and a navigation bar.
4.  **DONE:** Implement the "Product Management" feature using Web Components.
    -   **DONE:** Create `product-list` component to display products.
    -   **DONE:** Create `product-form` component to add and edit products.
    -   **DONE:** Implement "delete" functionality.
    -   **DONE:** Connect components to manage product data (add, edit, delete).
5.  **DONE:** Implement the "Customer Management" feature.
    -   **DONE:** Create `customer-list` component to display customers.
    -   **DONE:** Create `customer-form` component to add and edit customers.
    -   **DONE:** Implement "delete" functionality for customers.
    -   **DONE:** Connect customer components to manage data.
    -   **DONE:** Add right/left eye power fields to customer data, form, and list.
    -   **DONE:** Display "Left Eye" values next to "Right Eye" values with a separator in the customer form.
    -   **DONE:** Integrate customer purchase history tracking via SalesService.
    -   **DONE:** Remove 'email' field and add 'lastPurchaseDate' to customer data, form, and list.
    -   **DONE:** Remove 'Actions' column from customer list; add 'Notes' field to customer data, form, and list.
6.  **DONE:** Implement the "Sales & Ordering" feature.
    -   **DONE:** Create `sale-transaction` component for creating new sales.
    -   **DONE:** Allow selecting a customer and adding products to a cart.
    -   **DONE:** Calculate total price and record the transaction.
    -   **DONE:** Display a list of past sales.
7.  **DONE:** Implement "Inventory Tracking".
    -   **DONE:** Add a 'stock' property to products.
    -   **DONE:** When a sale is completed, decrease the stock of the sold products.
    -   **DONE:** Display the stock level in the product list.
    -   **DONE:** Visually indicate low-stock products.
8.  **DONE:** Performed `git push` to synchronize local changes with the remote repository.
9.  **DONE:** Adjust the `font-size` of `.tab-button` in `style.css` to ensure the "고객 관리" switch appears on a single line.
10. **IN PROGRESS:** Verify that left eye information is displayed next to right eye information in the customer management popup, and modify `main.js` if necessary.
11. **DONE:** Force update `index.html` and `main.js` by adding comments as requested by user.
12. **DONE:** Adjust customer management popup size to prevent left eye data overflow.
13. **DONE:** Reduce font size of customer info edit button (`.edit-customer-btn`) to display on a single line in `CustomerList`.
14. **DONE:** Modify `customer-list` table headers: change individual S, C, AX headers to merged "오른쪽" and "왼쪽" (using colspan), while keeping actual data display unchanged.
15. **DONE:** Prevent S, C, AX headers from changing color on mouse hover in `CustomerList`.
16. **DONE:** Center-align all search results (table content) in `CustomerList`.
17. **DONE:** Move VIP and Caution checkboxes next to the customer name field in `CustomerForm`.
18. **DONE:** Remove the 'D' character from the dose input box formatting in `CustomerForm`, while maintaining other formatting.
19. **IN PROGRESS:** Modify `CustomerPurchaseHistory` headers to "구매일자", "구매품목", "금액", "총 금액".
20. **IN PROGRESS:** Group purchase history items by "구매일자" and display them together in `CustomerPurchaseHistory`.