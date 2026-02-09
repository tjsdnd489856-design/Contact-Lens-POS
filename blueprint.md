# Blueprint for Contact Lens POS System

## Overview
This document outlines the architecture, features, and ongoing development plan for a Contact Lens Point-of-Sale (POS) system within the Firebase Studio environment. The system focuses on managing customer, product (contact lens inventory), and sales data, utilizing modern web standards and Firebase services.

## Detailed Outline

### 1. Core Application Structure
*   **`index.html`**: The single-page application entry point, structuring the main layout with tab-based navigation for Customers, Products, and Sales.
*   **`main.js`**: The main JavaScript file orchestrating component loading, event handling, and application logic.
*   **`style.css`**: Global styles for the application, adhering to modern CSS practices.
*   **`components/`**: Directory for Web Components, encapsulating reusable UI elements and their logic.
*   **`services/`**: Directory for JavaScript modules providing data access and business logic (e.g., `ProductService`, `CustomerService`, `SalesService`).
*   **`utils/`**: Utility functions, such as `udi-parser.js`.
*   **`lambda/`**: AWS Lambda function and related deployment scripts for backend logic, including secure external API interactions.

### 2. Data Management and Services
*   **`ProductService`**: Manages contact lens product inventory, including adding, updating, deleting products, and fetching product details. It integrates with an AWS Lambda function via API Gateway for external UDI API lookups.
*   **`CustomerService`**: Handles customer data, including creation, retrieval, and purchase history tracking.
*   **`SalesService`**: Manages sales transactions and records.

### 3. Key Features

#### a. Tab-based Navigation
*   Allows users to switch between "고객 관리" (Customer Management), "재고 관리" (Inventory Management), and "판매" (Sales) sections.

#### b. Customer Management
*   **Customer List (`customer-list.component.js`)**: Displays a list of customers.
*   **Customer Form (`customer-form.component.js`)**: Provides functionality to add or edit customer details.
*   **Customer Purchase History (`customer-purchase-history.component.js`)**: Shows past purchases for a selected customer.
*   **Search**: Customers can be searched by name or the last four digits of their contact number.

#### c. Product/Inventory Management
*   **Product List (`product-list.component.js`)**: Displays the current inventory of contact lenses.
*   **Product Form (`product-form.component.js`)**: Used for manually adding or editing product details.
*   **Discard Inventory Modal (`discard-inventory-modal.component.js`)**: Allows for recording discarded inventory.
*   **Abnormal Inventory Panel (`abnormal-inventory-list.component.js`)**: A side panel displaying products with abnormal (e.g., negative) quantities.
*   **Brand Product List Modal (`brand-product-list-modal.component.js`)**: Displays products filtered by brand.

#### d. Sales and Orders
*   **Sale Transaction (`sale-transaction.component.js`)**: Handles the process of recording a sale.
*   **Sales List (`sales-list.component.js`)**: Displays a history of sales transactions.

#### e. UDI-based Product Addition Feature
*   **Purpose**: To allow adding new contact lens products to inventory using UDI (Unique Device Identification) barcode information, by parsing the UDI and fetching additional details from an external API (Korean Ministry of Food and Drug Safety's Medical Device Standard Code Unity Information Service).
*   **Components Involved**:
    *   `index.html`: Provides the "UDI로 제품 추가" button and the `udi-scanner-modal` UI for UDI input, product details display, and "재고에 추가" button.
    *   `main.js`: Orchestrates the interaction, including opening/closing the modal, calling `udi-parser.js`, calling `ProductService` for external API lookup, updating the UI, and adding the product to inventory.
    *   `udi-parser.js`: Utility function to parse GS1-128 UDI barcode strings, extracting GTIN (UDI-DI), expiration date, lot number, and serial number.
    *   `product.service.js`: Contains `fetchProductDetailsFromExternalApi` which calls a Firebase Cloud Function to securely interact with the external UDI API.
    *   `lambda/get_medical_device_details.py`: The Python AWS Lambda function containing the core logic for fetching medical device details.
    *   `lambda/requirements.txt`: Lists Python dependencies for the Lambda function (e.g., `requests`, `boto3`).
    *   `lambda/package_lambda.sh`: A shell script to package the Lambda function and its dependencies into a deployable `.zip` file.
    *   `lambda/lambda_deployment_guide.md`: Provides instructions for deploying the Lambda function, setting up API Gateway, and configuring AWS Secrets Manager.
*   **Workflow**:
    1.  User navigates to the "재고 관리" tab.
    2.  User clicks the "UDI로 제품 추가" button.
    3.  The `udi-scanner-modal` opens.
    4.  User enters or scans a UDI barcode into the input field.
    5.  User clicks the "제품 정보 조회" button.
    6.  `main.js` calls `parseUdiBarcode` from `udi-parser.js` to extract relevant UDI components, especially the GTIN (UDI-DI).
    7.  `main.js` then calls `ProductService.fetchProductDetailsFromExternalApi(gtin), targeting the AWS API Gateway endpoint.`
    8.  The API Gateway endpoint triggers the `getMedicalDeviceDetails` AWS Lambda function with the GTIN.
    9.  The AWS Lambda function makes a secure API call to `https://apis.data.go.kr/1471000/MdeqStdCdUnityInfoService01/getMdeqStdCdUnityInfoList` using the API key retrieved from AWS Secrets Manager.
    10. The AWS Lambda function processes the external API response and returns a structured product object (brand, model, product name, etc.) to the frontend.
    11. `main.js` updates the `udi-scanner-modal` UI with the retrieved product details.
    12. The "재고에 추가" button becomes enabled. The user can adjust quantity and price fields.
    13. User clicks the "재고에 추가" button.
    14. `main.js` collects all product details from the modal (including user-adjusted quantity/price and UDI-parsed expiration/lot/serial numbers).
    15. `ProductService.addProduct(newProduct)` is called to add the new product to the in-memory inventory.
    16. An alert confirms the addition, and the `udi-scanner-modal` closes, clearing its state.
*   **Error Handling**: The system provides feedback for invalid UDI input, API lookup failures, and cases where no product details are found.

## Current Plan & Next Steps

This section will be updated with each new development task.

**Current Task**: Ensure all sales-related content is visible and functional on the "판매" tab.

### 1. Update `blueprint.md`
- **Objective**: Reflect the updated `index.html` `<h2>` tag change.
- **Details**:
    - Modify the `artifact_trail` entry for `index.html` to specify that the `<h2>` tag within the "Sales" tab content (`#sales-tab`) was also changed from "판매 및 주문" to "판매".
    
### 2. Examine `sale-transaction.component.js`'s `completeSale` method
- **Objective**: Verify the logic and calls to `SalesService.addSale`.
- **Details**: Double-check the method for any potential issues that could prevent sales from being added or correctly processed.

### 3. Mentally Simulate / Debug the sales workflow
- **Objective**: Identify potential points of failure or non-rendering in the sales process.
- **Details**: Trace the data flow from `SaleTransaction` -> `SalesService` -> `SalesList` to ensure each component is functioning as expected and passing data correctly.

**Updated `artifact_trail` entry for `index.html`**:
*   **`index.html`**: MODIFIED: UDI scanner modal embedding to correctly use `<udi-scanner-modal>` Web Component. Changed tab name "판매 및 주문" to "판매" in navigation button and the `<h2>` heading within the sales tab content.
*   **`services/sales.service.js`**: MODIFIED: `addSale` method now returns a Promise, aligning with the asynchronous handling in `sale-transaction.component.js`.
*   **`style.css`**: ADDED: CSS rule `display: block;` to custom elements (`sale-transaction-component`, `sales-list`, etc.) to ensure they render as block-level elements.
*   **`components/sale-transaction.component.js`**: ADDED: Temporary `console.log` statements to `constructor` and `connectedCallback` for debugging component lifecycle, and a top-level `console.log` to confirm module loading.