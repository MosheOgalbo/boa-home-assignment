import { Plugin } from 'vite';

export default function replaceShopifyApiKey(): Plugin {
	return {
		name: 'replace-shopify-api-key',
		transformIndexHtml(html) {
			return html.replace(/%SHOPIFY_API_KEY%/g, process.env.SHOPIFY_API_KEY || '');
		},
	};
}
