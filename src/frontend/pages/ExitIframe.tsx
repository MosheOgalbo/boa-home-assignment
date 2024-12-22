import { useAppBridge } from '@shopify/app-bridge-react';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ExitIframe() {
	const { search } = useLocation();
	const shopify = useAppBridge();
	shopify.loading(true);
	useEffect(() => {
		if (Boolean(shopify) && Boolean(search)) {
			const params = new URLSearchParams(search);
			const redirectUri = params.get('redirectUri');
			const url = new URL(decodeURIComponent(redirectUri as string));

			if (url.hostname === location.hostname) {
				window.open(redirectUri as string, '_top');
			}
		}
	}, [shopify, search]);

	return null;
}
