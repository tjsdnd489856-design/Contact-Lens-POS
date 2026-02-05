
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
