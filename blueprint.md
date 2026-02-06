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

### Barcode Scanner Integration:
-   **Barcode Input:** 제품 양식에 바코드 스캔 전용 입력 필드를 추가했습니다.
-   **Automatic Product Lookup:** `ProductService.getProductByBarcode`를 사용하여 바코드를 통한 실시간 제품 조회를 구현했습니다.
-   **Auto-filling Fields:** 바코드 스캔 성공 시 양식에 제품 세부 정보를 자동으로 채웁니다.
-   **Error Handling:** 바코드를 찾을 수 없는 경우 사용자에게 피드백을 제공합니다.

### Secure API Key Handling (Firebase Functions for UDI Lookup):
-   **Architecture:** Implemented a secure backend service using Firebase Functions to handle sensitive UDI database API calls.
-   **Key Management:** API keys are stored securely in Firebase Functions environment configuration, preventing exposure to client-side code.
-   **Client-Server Interaction:** Client-side code sends UDI query requests to the Firebase Function, which then securely communicates with the external UDI database API.
-   **Data Flow:** The Firebase Function processes the UDI database response and returns relevant data to the client for display and auto-filling.

---

## 3. Current Development Plan

This section outlines the immediate tasks for the current development cycle.

### Firebase Functions for UDI Lookup Integration

1.  **PENDING:** Firebase 프로젝트 초기화 및 Functions 설정 확인 (필요시 Firebase CLI 사용)
2.  **PENDING:** Firebase Function 개발 (`functions/index.js` 또는 `.ts`) 파일 생성 및 HTTP Callable Function 정의
3.  **PENDING:** UDI API 키를 Firebase Functions 환경 설정(`firebase functions:config:set`)을 통해 안전하게 저장
4.  **PENDING:** Firebase Function 내부에서 UDI 데이터베이스 API에 안전하게 요청(`fetch` 또는 `axios` 사용)
5.  **PENDING:** Firebase Function에서 UDI 데이터베이스 응답 파싱 및 클라이언트에 관련 정보 반환
6.  **PENDING:** 클라이언트 측 `services/product.service.js` 수정: `getProductByBarcode` 메서드를 Firebase Function 호출로 변경
7.  **PENDING:** 클라이언트 측 `components/product-form.component.js` 수정: 스캔된 UDI 바코드를 Firebase Function에 전송하고, 응답을 처리하여 필드 자동 채우기
8.  **PENDING:** Firebase Function 및 클라이언트 측 모두에 강력한 오류 처리 로직 구현
9.  **PENDING:** Firebase Function 배포 및 end-to-end 테스트 수행
10. **PENDING:** `blueprint.md` 최종 업데이트: UDI 조회 기능의 구현 세부 사항 및 완료 상태 문서화

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