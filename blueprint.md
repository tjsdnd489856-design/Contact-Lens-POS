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

---

## 3. Current Development Plan

This section outlines the immediate tasks for the current development cycle.

### Initial Setup & Core Feature Implementation

1.  **DONE:** Set up the project environment and Git repository.
2.  **DONE:** Create the basic HTML structure (`index.html`) for the main application layout.
3.  **DONE:** Style the main layout (`style.css`) with a modern and clean design, including a header, main content area, and a navigation bar.
4.  **DONE:** Implement the "Inventory Management" feature using Web Components.
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
    -   **DONE:** Decrease stock of sold products.
    -   **DONE:** Display a list of past sales.
7.  **DONE:** Implement "Inventory Tracking".
    -   **DONE:** Add a 'stock' property to products.
    -   **DONE:** When a sale is completed, decrease the stock of the sold products.
    -   **DONE:** Display the stock level in the product list.
    -   **DONE:** Visually indicate low-stock products.
8.  **DONE:** Performed `git push` to synchronize local changes with the remote repository.
9.  **DONE:** Adjust the `font-size` of `.tab-button` in `style.css` to ensure the "고객 관리" switch appears on a single line.
10. **DONE:** Verify that left eye information is displayed next to right eye information in the customer management popup, and modify `main.js` if necessary.
11. **DONE:** Force update `index.html` and `main.js` by adding comments as requested by user.
12. **DONE:** Adjust customer management popup size to prevent left eye data overflow.
13. **DONE:** Reduce font size of customer info edit button (`.edit-customer-btn`) to display on a single line in `CustomerList`.
14. **DONE:** Modify `customer-list` table headers: change individual S, C, AX headers to merged "오른쪽" and "왼쪽" (using colspan), while keeping actual data display unchanged.
15. **DONE:** Prevent S, C, AX headers from changing color on mouse hover in `CustomerList`.
16. **DONE:** Center-align all search results (table content) in `CustomerList`.
17. **DONE:** Move VIP and Caution checkboxes next to the customer name field in `CustomerForm`.
18. **DONE:** Remove the 'D' character from the dose input box formatting in `CustomerForm`, while maintaining other formatting.
19. **DONE:** Modify `CustomerPurchaseHistory` headers to "구매일자", "구매품목", "금액", "총 금액".
20. **DONE:** Group purchase history items by "구매일자" and display them together in `CustomerPurchaseHistory`.
21. **DONE:** Add "구매수량" header to `CustomerPurchaseHistory` table and display item quantities.
22. **DONE:** For purchases made on the same day, consolidate identical products by summing their quantities and amounts in `CustomerPurchaseHistory`.
23. **DONE:** Change "고객 삭제" button color to red and ensure its position is fixed (or at the start of the `form-buttons` container).
24.  **DONE:** Move "고객 수정" button to the far right within the `form-buttons` container.
25.  **DONE:** Change "고객 수정" button text to "고객 추가" when adding a new customer in `CustomerForm`.
26. **DONE:** Re-verify and fix the positioning and color of the "고객 삭제" and "고객 저장/수정" buttons in the customer modification popup. (재시도: `main.js` 내 `<style>`에 `form .form-buttons { justify-content: flex-end; }`와 `#delete-customer-from-form-btn { margin-right: auto; background-color: #c0392b; }` 명시적 추가. `_render()`의 `submit` 버튼 인라인 스타일 제거 및 텍스트 '고객 추가' 확인. `clearForm()`의 `submit` 버튼 텍스트 '고객 추가' 확인.)
27. **DONE:** Implement a brand-specific product list popup in the inventory management tab. Users can click on a brand button to open a popup that displays the stock status for that brand in a line-by-line format. This includes refactoring the `brand-product-list-modal.component.js` to be a presentational component, updating `app-initializer.js` to handle the modal's logic, and adjusting the brand button styles in `product-list.component.js`.

### Artifact Trail:
- `services/product.service.js`: ProductService 클래스를 포함하도록 생성하고, main.js에서 임포트하도록 수정했습니다.
- `services/customer.service.js`: CustomerService 클래스를 포함하도록 생성하고, main.js에서 임포트하도록 수정했습니다.
- `services/sales.service.js`: SalesService 클래스를 포함하도록 생성하고, main.js에서 임포트하도록 수정했습니다.
- `components/product-list.component.js`: ProductList 클래스를 포함하도록 생성하고, main.js에서 임포트하도록 수정했습니다.
- `components/product-form.component.js`: ProductForm 클래스를 포함하도록 생성하고, main.js에서 임포트하도록 수정했습니다.
- `components/customer-list.component.js`: CustomerList 클래스를 포함하도록 생성하고, main.js에서 임포트하도록 수정했습니다.
- `components/customer-form.component.js`: CustomerForm 클래스를 포함하도록 생성하고, main.js에서 임포트하도록 수정했습니다.
- `components/sale-transaction.component.js`: SaleTransaction 클래스를 포함하도록 생성하고, main.js에서 임포트하도록 수정했습니다.
- `components/sales-list.component.js`: SalesList 클래스를 포함하도록 생성하고, main.js에서 임포트하도록 수정했습니다.
- `components/customer-purchase-history.component.js`: CustomerPurchaseHistory 클래스를 포함하도록 생성하고, main.js에서 임포트하도록 수정했습니다.
- `components/app-initializer.js`: initializeApp 함수를 포함하도록 생성했으며, 누락된 서비스 import를 추가하여 수정했습니다.
- `main.js`: ProductService, CustomerService, SalesService, ProductList, ProductForm, CustomerList, CustomerForm, SaleTransaction, SalesList, CustomerPurchaseHistory, initializeApp의 정의를 제거하고 해당 임포트 문을 추가하도록 여러 번 수정되었습니다. 이전 셸 스크립트 오류로 인해 파일이 손상되어 git restore 후 인메모리 문자열 조작으로 수정되었습니다.
- `index.html`: `<script src="main.js"></script>`를 `<script type="module" src="main.js"></script>`로 업데이트했습니다.
- `components/`: UI 컴포넌트를 저장하기 위해 디렉토리가 생성되었습니다.
- `components/customer-form.component.js` 복구 및 누락된 서비스 import 수정: `CustomerForm` 컴포넌트 파일을 Git 기록에서 복구하고 `CustomerService` import를 추가했습니다.
- `components/customer-list.component.js` 누락된 서비스 import 수정: `CustomerService` import를 추가했습니다.
- `components/product-list.component.js` 누락된 서비스 import 수정: `ProductService` import를 추가했습니다.
- `components/product-form.component.js` 누락된 서비스 import 수정: `ProductService` import를 추가했습니다.
- `components/sale-transaction.component.js` 누락된 서비스 import 수정: `CustomerService`, `ProductService`, `SalesService` import를 추가했습니다.
- `components/sales-list.component.js` 누락된 서비스 import 수정: `CustomerService`, `SalesService` import를 추가했습니다.
- `components/customer-purchase-history.component.js` 누락된 서비스 import 수정: `CustomerService`, `SalesService` import를 추가했습니다.

### File System State:
- `cwd`: /home/user/contact-lens-pos/
- `created`: services/, services/product.service.js, services/customer.service.js, services/sales.service.js, components/, components/product-list.component.js, components/product-form.component.js, components/customer-list.component.js, components/customer-form.component.js, components/sale-transaction.component.js, components/sales-list.component.js, components/customer-purchase-history.component.js, components/app-initializer.js
- `modified`: main.js, index.html, components/app-initializer.js, components/customer-list.component.js, components/customer-form.component.js, components/product-list.component.js, components/product-form.component.js, components/sale-transaction.component.js, components/sales-list.component.js, components/customer-purchase-history.component.js

### Recent Actions:
- ProductService를 main.js에서 services/product.service.js로 추출하고 main.js에 import 문을 추가했습니다.
- CustomerService를 main.js에서 services/customer.service.js로 추출하고 main.js에 import 문을 추가했습니다.
- SalesService를 main.js에서 services/sales.service.js로 추출하고 main.js에 import 문을 추가했습니다.
- components/ 디렉토리를 생성했습니다.
- ProductList 컴포넌트를 main.js에서 components/product-list.component.js로 추출하고 main.js에 import 문을 추가했습니다.
- ProductForm 컴포넌트를 main.js에서 components/product-form.component.js로 추출하고 main.js에 import 문을 추가했습니다.
- CustomerList 컴포넌트를 main.js에서 components/customer-list.component.js로 추출하고 main.js에 import 문을 추가했습니다.
- CustomerForm 컴포넌트를 main.js에서 components/customer-form.component.js로 추출하고 main.js에 import 문을 추가했습니다.
- SaleTransaction 컴포넌트를 main.js에서 components/sale-transaction.component.js로 추출하고 main.js에 import 문을 추가했습니다.
- SalesList 컴포넌트를 main.js에서 components/sales-list.component.js로 추출하고 main.js에 import 문을 추가했습니다.
- CustomerPurchaseHistory 컴포넌트를 main.js에서 components/customer-purchase-history.component.js로 추출하고 main.js에 import 문을 추가했습니다.
- Tab Switching Logic을 main.js에서 components/app-initializer.js로 추출하고 main.js에 import 문과 initializeApp() 호출을 추가했습니다.
- index.html의 `<script src="main.js"></script>`를 `<script type="module" src="main.js"></script>`로 업데이트했습니다.
- components/app-initializer.js에 누락된 서비스 import를 추가했습니다.
- `CustomerForm` 컴포넌트 파일을 Git 기록에서 복구하고 `CustomerService` import를 추가했습니다.
- `CustomerList` 컴포넌트에 `CustomerService` import를 추가했습니다.
- `ProductList` 컴포넌트에 `ProductService` import를 추가했습니다.
- `ProductForm` 컴по넌트에 `ProductService` import를 추가했습니다.
- `SaleTransaction` 컴포넌트에 `CustomerService`, `ProductService`, `SalesService` import를 추가했습니다.
- `SalesList` 컴포넌트에 `CustomerService`, `SalesService` import를 추가했습니다.
- `CustomerPurchaseHistory` 컴포넌트에 `CustomerService`, `SalesService` import를 추가했습니다.

### Task State:
- `DONE`: 'services' 디렉토리 생성.
- `DONE`: ProductService를 'services/product.service.js'로 추출하고 main.js에서 임포트하도록 수정.
- `DONE`: CustomerService를 'services/customer.service.js'로 추출하고 main.js에서 임포트하도록 수정.
- `DONE`: SalesService를 'services/sales.service.js'로 추출하고 main.js에서 임포트하도록 수정.
- `DONE`: 필요하다면 index.html 업데이트.
- `DONE`: 'components' 디렉토리 생성.
- `DONE`: ProductList 컴포넌트를 'components/product-list.component.js'로 추출하고 main.js에서 임포트하도록 수정.
- `DONE`: ProductForm 컴포넌트를 'components/product-form.component.js'로 추출하고 main.js에서 임포트하도록 수정.
- `DONE`: CustomerList 컴포넌트를 'components/customer-list.component.js'로 추출하고 main.js에서 임포트하도록 수정.
- `DONE`: CustomerForm 컴포넌트를 'components/customer-form.component.js'로 추출하고 main.js에서 임포트하도록 수정.
- `DONE`: SaleTransaction 컴포넌트를 'components/sale-transaction.component.js'로 추출하고 main.js에서 임포트하도록 수정.
- `DONE`: SalesList 컴포넌트를 'components/sales-list.component.js'로 추출하고 main.js에서 임포트하도록 수정.
- `DONE`: CustomerPurchaseHistory 컴포넌트를 'components/customer-purchase-history.component.js'로 추출하고 main.js에서 임포트하도록 수정.
- `DONE`: Tab Switching Logic을 'components/app-initializer.js'로 추출하고 main.js에서 임포트하도록 수정.
- `DONE`: 누락된 서비스 import를 모든 구성 요소에 추가하고 CustomerForm을 복구했습니다.
- `DONE`: Inventory Management 탭에서 재고 목록을 쉽게 볼 수 있도록 브랜드 필터 버튼을 추가했습니다.
- `DONE`: 브랜드별 제품 목록을 보여주는 팝업을 구현하고, `brand-product-list-modal.component.js`, `app-initializer.js`, `product-list.component.js`를 수정했습니다.
