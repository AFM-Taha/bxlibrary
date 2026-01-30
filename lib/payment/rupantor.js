import axios from 'axios'
import crypto from 'crypto'

class RupantorPayService {
  constructor(config) {
    this.apiKey = config.apiKey
    this.environment = config.environment
    this.baseUrl =
      config.environment === 'production'
        ? 'https://payment.rupantorpay.com/api/payment'
        : 'https://payment.rupantorpay.com/api/payment'
  }

  async createPaymentSession({
    amount,
    currency,
    orderId,
    customerEmail,
    description,
    successUrl,
    cancelUrl,
    metadata = {},
  }) {
    try {
      // According to documentation:
      // Endpoint: https://payment.rupantorpay.com/api/payment/checkout (POST)
      // Params: fullname, email, amount, success_url, cancel_url, webhook_url, meta_data

      const payload = {
        fullname: metadata.fullname || 'Customer', // Fallback
        email: customerEmail,
        amount: amount,
        success_url: successUrl,
        cancel_url: cancelUrl,
        meta_data: JSON.stringify({ ...metadata, order_id: orderId }),
      }

      const response = await axios.post(`${this.baseUrl}/checkout`, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': this.apiKey,
          'X-CLIENT': 'bxlibrary', // Static client ID for now
        },
      })

      // Log response for debugging
      console.log('RupantorPay init response:', response.data)

      if (response.data && (response.data.payment_url || response.data.url)) {
        return {
          success: true,
          paymentUrl: response.data.payment_url || response.data.url,
          sessionId: orderId,
          provider: 'rupantor',
        }
      } else {
        throw new Error(response.data.message || 'Failed to get payment URL')
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message
      console.error(
        'RupantorPay init error:',
        error.response?.data || error.message,
      )
      throw new Error(
        `Failed to initialize RupantorPay session: ${errorMessage}`,
      )
    }
  }

  async verifyPayment(transactionId) {
    try {
      // Endpoint: https://payment.rupantorpay.com/api/payment/verify-payment (GET)
      // Params: transaction_id

      const response = await axios.get(`${this.baseUrl}/verify-payment`, {
        params: { transaction_id: transactionId },
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': this.apiKey,
          'X-CLIENT': 'bxlibrary',
        },
      })

      console.log('RupantorPay verify response:', response.data)

      if (response.data && response.data.status === 'success') {
        // Assuming 'status' field
        return {
          success: true,
          ...response.data,
        }
      }

      return { success: false, ...response.data }
    } catch (error) {
      console.error(
        'Verification failed:',
        error.response?.data || error.message,
      )
      return { success: false, error: error.message }
    }
  }
}

export default RupantorPayService
