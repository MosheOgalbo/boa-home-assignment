import React, { ReactNode } from 'react';
import { AppProvider } from '@shopify/polaris';
import translations from '@shopify/polaris/locales/en.json';
import '@shopify/polaris/build/esm/styles.css';
import { LinkLikeComponentProps } from '@shopify/polaris/build/ts/src/utilities/link';

function AppBridgeLink({ url, children, external, ...rest }: LinkLikeComponentProps) {
	const IS_EXTERNAL_LINK_REGEX = /^(?:[a-z][a-z\d+.-]*:|\/\/)/;

	if (external || IS_EXTERNAL_LINK_REGEX.test(url)) {
		return (
			<a target="_blank" rel="noopener noreferrer" href={url} {...rest}>
				{children}
			</a>
		);
	}

	return (
		<a {...rest}>
			{children}
		</a>
	);
}

/**
 * Sets up the AppProvider from Polaris.
 * @desc PolarisProvider passes a custom link component to Polaris.
 * The Link component handles navigation within an embedded app.
 * Prefer using this vs any other method such as an anchor.
 * Use it by importing Link from Polaris, e.g:
 *
 * ```
 * import {Link} from '@shopify/polaris'
 *
 * function MyComponent() {
 *  return (
 *    <div><Link url="/tab2">Tab 2</Link></div>
 *  )
 * }
 * ```
 *
 * PolarisProvider also passes translations to Polaris.
 *
 */
type PolarisProviderProps = {
	children: ReactNode;
};
export function PolarisProvider({ children }: PolarisProviderProps) {
	return (
		<AppProvider i18n={translations} linkComponent={AppBridgeLink}>
			{children}
		</AppProvider>
	);
}
