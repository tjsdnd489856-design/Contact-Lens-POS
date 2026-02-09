/**
 * Manages tab switching functionality for the application.
 */
export function initTabManager(tabButtons, tabContents) {
    if (!tabButtons || tabButtons.length === 0 || !tabContents || tabContents.length === 0) {
        console.error('Tab buttons or contents not found for TabManager initialization.');
        return;
    }

    /**
     * Shows a specific tab and activates its corresponding button.
     * @param {string} tabId - The ID of the tab to show.
     */
    function showTab(tabId) {
        tabContents.forEach(content => {
            if (content.id === `${tabId}-tab`) {
                content.classList.add('active');
            } else {
                content.classList.remove('active');
            }
        });
        tabButtons.forEach(button => {
            if (button.dataset.tab === tabId) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
        console.log(`Tab switched to: ${tabId}`);
    }

    // Attach event listeners to tab buttons
    tabButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            event.preventDefault();
            const tabId = button.dataset.tab;
            showTab(tabId);
        });
    });

    // Handle custom event for tab switching
    document.addEventListener('showTab', (e) => {
        showTab(e.detail.tabId);
        // Additional logic for tab-specific actions can be dispatched here
        // or handled by specific component listeners.
    });

    // Show the initial active tab (customers tab by default)
    showTab('customers');
    console.log('Initial tab set to customers.');
}