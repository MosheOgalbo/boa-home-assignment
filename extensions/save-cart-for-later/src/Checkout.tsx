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
    const [savedCart, setSavedCart] = useState<any[]>([]);

    // בדוק אם המשתמש מחובר ועדכן את הצבעים הדינמיים
    useEffect(() => {
        const checkLoginStatus = async () => {
            try {
                const token = await sessionToken.get();
                setIsLoggedIn(Boolean(token));
            } catch (error) {
                console.error('Error checking login status:', error);
                setIsLoggedIn(false); // ברירת מחדל למשתמש לא מחובר במקרה של שגיאה
            }
        };
        checkLoginStatus();
    }, [sessionToken]);

    // קבל את העגלה השמורה מהשרת
    useEffect(() => {
        const fetchSavedCart = async () => {
            if (isLoggedIn) {
                const token = await sessionToken.get();
                const appProxyUrl = new URL('/app_proxy', 'https://scenarios-energy-msgid-long.trycloudflare.com');
                appProxyUrl.searchParams.append('shop', 'home-assignment-113.myshopify.com');
                appProxyUrl.searchParams.append('path_prefix', '/boa-home-task-MO');
                appProxyUrl.searchParams.append('subpath', 'retrieve-cart');

                try {
                    const response = await fetch(appProxyUrl.toString(), {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                        },
                    });
                    const data = await response.json();
                    setSavedCart(data.items || []);
                } catch (error) {
                    console.error('Error fetching saved cart:', error);
                }
            }
        };

        if (isLoggedIn) {
            fetchSavedCart();
        }
    }, [isLoggedIn, sessionToken]);

    // שינוי מצב הצ'קבוקס
    const handleCheckboxChange = (variantId: string) => {
        setSelectedItems(prev => {
            if (prev.includes(variantId)) {
                return prev.filter(id => id !== variantId);
            }
            return [...prev, variantId];
        });
    };

    // שמור את הפריטים בשרת
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
            const selectedProducts = cartLines
                .filter(line => selectedItems.includes(line.merchandise.id))
                .map(line => ({
                    variantId: line.merchandise.id,
                    quantity: line.quantity,
                }));

            const appProxyUrl = new URL('/app_proxy', 'https://scenarios-energy-msgid-long.trycloudflare.com');
            appProxyUrl.searchParams.append('shop', 'home-assignment-113.myshopify.com');
            appProxyUrl.searchParams.append('path_prefix', '/boa-home-task-MO');
            appProxyUrl.searchParams.append('subpath', 'save-cart');

            const response = await fetch(appProxyUrl.toString(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    items: selectedProducts,
                    customer_id: 'test-customer', // שנה לפי הצורך
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to save cart. Please try again.');
            }

            setMessage({
                type: 'success',
                content: `Saved ${selectedProducts.length} items for later.`,
            });
            setSelectedItems([]);
        } catch (error) {
            console.error('Save cart error:', error);
            setMessage({
                type: 'critical',
                content: error instanceof Error ? error.message : 'Unable to save items. Please try again.',
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <BlockStack border="base" padding="base" spacing="loose">
            {/* כותרת */}
            <Text size="medium" emphasis="bold">Save items for later</Text>

            {/* הודעה אם המשתמש לא מחובר */}
            {!isLoggedIn && (
                <Banner status="critical">
                    You must log in to save items for later.
                </Banner>
            )}

            {/* הודעה למשתמש */}
            {message && (
                <Banner status={message.type}>
                    {message.content}
                </Banner>
            )}

            {/* רשימת המוצרים */}
            <BlockStack spacing="tight">
                {cartLines.map(line => (
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

            {/* כפתור שמירה */}
            <Button
                onPress={handleSave}
                disabled={isSaving || selectedItems.length === 0 || !isLoggedIn}
            >
                {isSaving ? 'Saving...' : `Save ${selectedItems.length} Selected Items`}
            </Button>

            {/* כפתור שליפת עגלה */}
            {isLoggedIn && savedCart.length > 0 && (
                <Button
                    onPress={() => {
                        savedCart.forEach(item => {
                            fetch('/cart/add.js', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({ id: item.variantId, quantity: item.quantity }),
                            });
                        });
                    }}
                >
                    Retrieve Saved Cart
                </Button>
            )}
        </BlockStack>
    );
}
