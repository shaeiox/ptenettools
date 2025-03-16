// Test script to check if the application is working correctly
document.addEventListener('DOMContentLoaded', function() {
    console.log('Test script loaded successfully');
    
    // Test fetch to the API
    fetch('/api/trace')
        .then(response => {
            console.log('API test response:', response);
            if (!response.ok) {
                console.error('API test failed with status:', response.status);
            } else {
                console.log('API test successful');
            }
        })
        .catch(error => {
            console.error('API test error:', error);
        });
}); 