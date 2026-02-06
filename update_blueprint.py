
import re
import os

blueprint_path = 'blueprint.md'

with open(blueprint_path, 'r') as f:
    content = f.read()

# Define the new, correct Task State content
new_task_state_content_full = """### Task State:
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
- `DONE`: 상단 탭, 새 고객 추가 팝업, 검색 기능이 작동하지 않던 회귀 버그를 해결했습니다. 주요 원인은 `main.js`에 `brand-product-list-modal.component.js`가 임포트되지 않아 사용자 정의 요소가 정의되지 않았기 때문입니다. 또한, `app-initializer.js`에서 `closeBrandProductListModalElement` 이벤트 리스너를 올바르게 수정했습니다.
- `DONE`: 전체 브랜드 제품이 표시되도록 `brand-product-list-modal.component.js`를 수정했습니다.
- `DONE`: 재고 목록 팝업에서 바코드와 가격을 삭제하고, "브랜드 - 유형 (투명/컬러) - 제품명 - 도수 (S/C/AX)"로 세분화하여 표시하는 다단계 드릴다운 선택을 구현했습니다. 이를 위해 `brand-product-list-modal.component.js`와 `services/product.service.js`를 수정하고 모달 크기를 키웠습니다.
- `DONE`: 재고 폐기 팝업의 목록을 재고 관리 탭처럼 버튼식 목록으로 변경했습니다.
- `DONE`: `discard-inventory-modal.component.js`의 구문 오류를 수정했습니다 (불필요한 닫는 중괄호 제거).
- `DONE`: 재고 폐기 팝업에 브랜드별 목록을 먼저 보여주고, 브랜드 선택 시 해당 브랜드의 제품 목록을 보여주도록 기능을 구현했습니다.
- `DONE`: 재고 폐기 팝업의 세부 제품 목록을 버튼식이 아닌 리스트 형식으로 변경했습니다.
- `DONE`: 재고 폐기 팝업의 세부 제품 목록에서 도수와 축 정보를 한 줄로 간결하게 표시하도록 변경했습니다.
- `DONE`: 재고 폐기 팝업에 브랜드 선택, 제품 선택, 제품의 세부 도수 선택을 포함하는 3단계 드릴다운 선택 기능을 구현했습니다.
- `DONE`: 재고 폐기 팝업의 최종 세부 목록(도수 옵션)을 S(구면), C(원주면) 값으로 오름차순/내림차순 정렬할 수 있는 기능을 추가했습니다.
- `DONE`: 재고 폐기 팝업의 최종 세부 목록(도수 옵션)을 표 형식으로 한눈에 볼 수 있도록 변경했습니다.
- `DONE`: 재고 폐기 팝업의 세부 목록(도수 옵션)에서 오름/내림차순 필터를 표 헤더 클릭으로 적용할 수 있도록 변경했습니다.
- `DONE`: 우측에 "주문/이상재고"라는 제목의 사이드 패널을 추가하고, 재고 수량이 음수인 제품을 표 형식으로 목록화하는 기능을 구현했습니다.
- `DONE`: "이상 재고 보기" 버튼을 재고관리 탭 안 오른쪽 끝으로 이동하고, 사이드 패널이 외부 클릭 시 자연스럽게 닫히도록 설정했습니다.
"""

# Find the start and end of the Task State section
task_state_heading = '### Task State:'
artifact_trail_heading = '### Artifact Trail:'
file_system_state_heading = '### File System State:'
recent_actions_heading = '### Recent Actions:'

task_state_start_index = content.find(task_state_heading)
artifact_trail_start_index = content.find(artifact_trail_heading)
file_system_state_start_index = content.find(file_system_state_heading)
recent_actions_start_index = content.find(recent_actions_heading)


if task_state_start_index == -1:
    print('Error: "### Task State:" section not found.')
    exit(1)

# Extract content before Task State heading
pre_task_state_content = content[:task_state_start_index]

# Extract content after Task State section (starting from Artifact Trail heading)
post_task_state_content_start_index = -1
if artifact_trail_start_index != -1:
    post_task_state_content_start_index = artifact_trail_start_index
elif file_system_state_start_index != -1:
    post_task_state_content_start_index = file_system_state_start_index
elif recent_actions_start_index != -1:
    post_task_state_content_start_index = recent_actions_start_index

post_task_state_content = ''
if post_task_state_content_start_index != -1:
    post_task_state_content = content[post_task_state_content_start_index:]

# Combine parts
# Ensure there's a blank line before and after the new task state content
final_content = pre_task_state_content.strip() + '\n\n' + \
                new_task_state_content_full.strip() + '\n\n' + \
                post_task_state_content.strip() + '\n'

with open(blueprint_path, 'w') as f:
    f.write(final_content)

print(f'{blueprint_path} completely reconstructed and updated successfully.')
