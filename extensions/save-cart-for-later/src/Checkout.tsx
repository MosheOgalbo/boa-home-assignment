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

    // Check if the user is logged in
    useEffect(() => {
        const checkLoginStatus = async () => {
            const token = await sessionToken.get();
            setIsLoggedIn(Boolean(token));
        };
        checkLoginStatus();
    }, [sessionToken]);

    //Handling of changing the checkbox state
    const handleCheckboxChange = (variantId: string) => {
        setSelectedItems(prev => {
            if (prev.includes(variantId)) {
                return prev.filter(id => id !== variantId);
            }
            return [...prev, variantId];
        });
    };

    //Handling the storage of the items
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

                const appProxyUrl = new URL('/app_proxy', 'https://scenarios-energy-msgid-long.trycloudflare.com');
                appProxyUrl.searchParams.append('shop', 'home-assignment-113.myshopify.com');
                appProxyUrl.searchParams.append('path_prefix', '/apps');
                appProxyUrl.searchParams.append('subpath', 'boa-home-task-bv');
                appProxyUrl.searchParams.append('path', 'save-cart');

                const response = await fetch('https://scenarios-energy-msgid-long.trycloudflare.com/app_proxy', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        items: selectedProducts,
                        customer_id: 'test-customer',
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
                    type: 'success',
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
        <BlockStack border="base" padding="base" spacing="loose">
            {/* selection title */}
            <Text size="medium" emphasis="bold">Save items for later</Text>

            {/* Display a critical message if the user is not logged in */}        {!isLoggedIn && (
                <Banner status="critical">
                    You must log in to save items for later.
                </Banner>
            )}

            {message && (
                <Banner status={message.type}>
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
