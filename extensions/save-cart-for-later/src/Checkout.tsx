import {
    reactExtension,
    BlockStack,
    Text,
    Banner,
    useCartLines,
    useApi,
    useStorage,
    Checkbox,
    Button,
} from '@shopify/ui-extensions-react/checkout';
import { useState, useEffect } from 'react';

export default reactExtension('purchase.checkout.block.render', () => <Extension />);

function Extension() {
    const cartLines = useCartLines();
    const { sessionToken } = useApi();
    const storage = useStorage();

    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'info' | 'success' | 'warning' | 'critical', content: string } | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    const [bgColor, setBgColor] = useState<string>('#ffffff'); // Default background color
    const [textColor, setTextColor] = useState<string>('#000000'); // Default text color

    // Check if the user is logged in and update the UI accordingly
    useEffect(() => {
        const checkLoginStatus = async () => {
            try {
                const token = await sessionToken.get();
                setIsLoggedIn(Boolean(token));

                // If the user is logged in, change the background and text colors
                if (token) {
                    setBgColor('#e0ffe0'); // Greenish background for logged-in users
                    setTextColor('#007500'); // Dark green text for logged-in users
                } else {
                    setBgColor('#ffcccc'); // Light red background for logged-out users
                    setTextColor('#cc0000'); // Red text for logged-out users
                }
            } catch (error) {
                console.error('Error checking login status:', error);
                setIsLoggedIn(false);  // Default to logged-out state in case of error
            }
        };
        checkLoginStatus();
    }, [sessionToken]);

    // Handling checkbox state change
    const handleCheckboxChange = (variantId: string) => {
        setSelectedItems(prev => {
            if (prev.includes(variantId)) {
                return prev.filter(id => id !== variantId);
            }
            return [...prev, variantId];
        });
    };

    // Handling the storage of selected items
    const handleSave = async () => {
        if (selectedItems.length === 0) return;

        setIsSaving(true);
        setMessage(null);

        try {
            if (!isLoggedIn) {
                setMessage({
                    type: 'critical',
                    content: 'You must log in to save items for later.',
                });
                return;
            }

            const token = await sessionToken.get();
            if (!token) {
                throw new Error('Authentication failed');
            }

            const selectedProducts = cartLines
                .filter(line => selectedItems.includes(line.merchandise.id))
                .map(line => ({
                    variantId: line.merchandise.id,
                    quantity: line.quantity
                }));

            // Save the items in local memory
            await storage.write('savedCart', JSON.stringify({
                items: selectedProducts
            }));

            // Save the items on the server
            try {
                const timestamp = Math.floor(Date.now() / 1000).toString();

                // Use actual customer id from sessionToken
                const customerId = await sessionToken.get();

                // Ensure correct proxy URL and parameters
                const appProxyUrl = new URL('/app_proxy', 'https://scenarios-energy-msgid-long.trycloudflare.com');
                appProxyUrl.searchParams.append('shop', 'home-assignment-113.myshopify.com');
                appProxyUrl.searchParams.append('path_prefix', '/boa-home-task-MO');
                appProxyUrl.searchParams.append('subpath', 'retrieve-cart');

                const response = await fetch(appProxyUrl.toString(), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        items: selectedProducts,
                        customer_id: customerId, // Use dynamic customer_id
                        timestamp
                    })
                });

                const responseText = await response.text();

                if (!response.ok) {
                    let errorMessage = 'Failed to save to backend';
                    try {
                        const errorData = responseText ? JSON.parse(responseText) : null;
                        errorMessage = errorData?.message || errorMessage;
                    } catch (e) {
                        console.error('Error parsing response:', e);
                    }
                    throw new Error(errorMessage);
                }

                setMessage({
                    type: 'success',
                    content: `Saved ${selectedProducts.length} items for later`
                });
            } catch (backendError) {
                console.error('Backend save error:', backendError);
                setMessage({
                    type: 'warning',
                    content: `Saved ${selectedProducts.length} items locally`
                });
            }

            setSelectedItems([]);
        } catch (error) {
            console.error('Save cart error:', error);
            setMessage({
                type: 'critical',
                content: error instanceof Error ? error.message : 'Unable to save items. Please try again.'
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <BlockStack border="base" padding="base" spacing="loose" style={{ backgroundColor: bgColor }}>
            <Text size="medium" emphasis="bold" style={{ color: textColor }}>Save items for later</Text>

            {/* Display a critical message if the user is not logged in */}
            {!isLoggedIn && (
                <Banner status="critical" style={{ backgroundColor: '#ffcccc' }}>
                    You must log in to save items for later.
                </Banner>
            )}

            {message && (
                <Banner status={message.type} style={{ backgroundColor: message.type === 'critical' ? '#ffcccc' : '#e0ffe0' }}>
                    {message.content}
                </Banner>
            )}

            <BlockStack spacing="tight">
                {cartLines.map((line) => (
                    <Checkbox
                        key={line.merchandise.id}
                        name={`save-${line.merchandise.id}`}
                        checked={selectedItems.includes(line.merchandise.id)}
                        onChange={() => handleCheckboxChange(line.merchandise.id)}
                        disabled={isSaving}
                    >
                        <Text>{line.merchandise.title}</Text>
                    </Checkbox>
                ))}
            </BlockStack>

            <Button
                onPress={handleSave}
                disabled={isSaving || selectedItems.length === 0 || !isLoggedIn}
            >
                {isSaving ? 'Saving...' : `Save ${selectedItems.length} Selected Items`}
            </Button>
        </BlockStack>
    );
}
