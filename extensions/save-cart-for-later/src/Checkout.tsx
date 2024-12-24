import {
  reactExtension,
  Banner,
  BlockStack,
  Button,
  Text
} from '@shopify/ui-extensions-react/checkout'
import { useState, useEffect } from 'react'
 import { express } from 'express'

// Extending the Extension
export default reactExtension('purchase.checkout.block.render', () => (
  <Extension />
))

//const variantid = 'gid://shopify/ProductVariant/1234567890'

function Extension () {
  const [isLoggedIn, setIsLoggedIn] = useState(false) // Managing the login state
  const [cartStatus, setCartStatus] = useState('')
  //const [variantData, setVariantData] = useState<null | any>(null)
  const [query] = useApi()

  useEffect(() => {
    // Check if the user is logged in or not
    checkLoginStatus()
  }, [])

  const checkLoginStatus = async () => {
    // API call to check if the user is logged in
    try {
      const response = await fetch('/api/check-login')
      const data = await response.json()
      if (data.loggedIn) {
        setIsLoggedIn(true)
        setCartStatus('cart recovery')
      } else {
        setIsLoggedIn(false)
        setCartStatus('To restore the cart, please login')
      }
    } catch (error) {
      console.error('login error', error)
    }
  }

  const handleRetrieveCart = async () => {
    if (isLoggedIn) {
      // API call to restore the cart if the user is logged in

      try {
        const response = await fetch('/api/retrieve-cart')
        const cart = await response.json()
        // Adding the products to the cart in Shopify
        api.addItemsToCart(cart.products)
      } catch (error) {
        console.error('Error restoring cart', error)
      }
    }
  }

//   useEffect(() => {
//     async function getVarriantData(){
//     const queryResult = await query(`{
//             node(id: "${variantid}"){
//             ... on ProductVariant {
//             title
//             price{
//             amount
//             currencyCode
//             }}}}`)
//             console.log(queryResult);
//         }

//             getVarriantData()
//   }, [])

  return (
    <BlockStack border={'dotted'} padding={'tight'}>
      <Banner title='save-cart-for-later'>{cartStatus}</Banner>
      {isLoggedIn && (
        <Button onPress={handleRetrieveCart}> Return a cart </Button>
      )}
      {!isLoggedIn && <Text> Sign in to restore cart </Text>}
    </BlockStack>
  )
}
