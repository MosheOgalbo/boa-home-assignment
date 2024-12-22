import React from 'react';
import { Page, Layout, EmptyState } from '@shopify/polaris';
import { TitleBar } from '@shopify/app-bridge-react';

export default function HomePage() {
	return (
		<Page narrowWidth>
			<TitleBar title="BOA Ideas" />
			<Layout>
				<Layout.Section>
					<EmptyState
						heading="BOA Ideas"
						image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
					></EmptyState>
				</Layout.Section>
			</Layout>
		</Page>
	);
}
