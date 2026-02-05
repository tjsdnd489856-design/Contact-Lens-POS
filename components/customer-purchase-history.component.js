// --- CustomerPurchaseHistory Component ---
export default class CustomerPurchaseHistory extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.selectedCustomerId = null;
        this.renderHistory = this.renderHistory.bind(this);
        document.addEventListener('customerSelectedForHistory', (e) => this.renderHistory(e.detail));
        document.addEventListener('salesUpdated', () => this.renderHistory(this.selectedCustomerId)); // Re-render if sales update
    }

    renderHistory(customerId) {
        this.selectedCustomerId = customerId;
        const customer = customerId ? CustomerService.getCustomerById(customerId) : null;
        const sales = customer ? SalesService.getSalesByCustomerId(customerId) : [];

        // Group purchases by date and then by product
        const groupedPurchases = {}; // { date: { totalAmount: X, items: { productId: { ...item, totalQuantity, totalItemAmount } } } }

        sales.forEach(sale => {
            const date = new Date(sale.date).toISOString().split('T')[0]; // YYYY-MM-DD
            if (!groupedPurchases[date]) {
                groupedPurchases[date] = {
                    totalAmount: 0,
                    items: {} // { productId: { product, quantity, itemTotal } }
                };
            }

            sale.items.forEach(item => {
                if (!groupedPurchases[date].items[item.product.id]) {
                    groupedPurchases[date].items[item.product.id] = {
                        product: item.product,
                        quantity: 0,
                        itemTotal: 0
                    };
                }
                groupedPurchases[date].items[item.product.id].quantity += item.quantity;
                groupedPurchases[date].items[item.product.id].itemTotal += (item.product.price * item.quantity);
            });
            groupedPurchases[date].totalAmount += sale.total;
        });

        let tbodyContent = '';
        for (const date in groupedPurchases) {
            const dateGroup = groupedPurchases[date];
            const itemsArray = Object.values(dateGroup.items); // Convert items object to array
            const rowspan = itemsArray.length; // Number of unique items for this date

            itemsArray.forEach((item, itemIndex) => {
                tbodyContent += `
                    <tr>
                        ${itemIndex === 0 ? `<td rowspan="${rowspan}">${date}</td>` : ''}
                        <td>${item.product.brand} ${item.product.model}</td>
                        <td>$${item.itemTotal.toFixed(2)}</td>
                        <td>${item.quantity}</td>
                        ${itemIndex === 0 ? `<td rowspan="${rowspan}">$${dateGroup.totalAmount.toFixed(2)}</td>` : ''}
                    </tr>
                `;
            });
        }

        const template = document.createElement('template');
        template.innerHTML = `
            <style>
                h4 { margin-top: 2rem; border-top: 1px solid #eee; padding-top: 2rem; }
                table { width: 100%; border-collapse: collapse; margin-top: 1rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                th, td { border: 1px solid #ddd; padding: 12px; text-align: center; } /* 검색 결과 가운데 정렬 */
                thead { background-color: #5cb85c; color: white; } /* Green header for purchase history */
                tbody tr:nth-child(even) { background-color: #f2f2f2; }
                .message { text-align: center; padding: 1rem; color: #555; }
                thead tr:hover { background-color: #5cb85c; cursor: default; } /* Prevent hover on header */
                thead th { text-align: center; } /* Center align header text */
            </style>
            <h4>고객 구매 내역</h4>
            ${customer ? `
                ${Object.keys(groupedPurchases).length > 0 ? `
                <table>
                    <thead>
                        <tr>
                            <th>구매일자</th>
                            <th>구매품목</th>
                            <th>금액</th>
                            <th>구매수량</th>
                            <th>총 금액</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tbodyContent}
                    </tbody>
                </table>
                ` : `<p class="message">선택된 고객의 구매 내역이 없습니다.</p>`}
            ` : `<p class="message">고객을 선택하면 구매 내역이 표시됩니다.</p>`}
        `;
        this.shadowRoot.innerHTML = '';
        this.shadowRoot.appendChild(template.content.cloneNode(true));
    }
}
customElements.define('customer-purchase-history', CustomerPurchaseHistory);