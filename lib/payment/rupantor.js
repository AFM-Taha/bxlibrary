import axios from 'axios'
import crypto from 'crypto'

class RupantorPayService {
  constructor(config) {
    this.apiKey = config.apiKey
    this.merchantId = config.merchantId
    this.secretKey = config.secretKey
    this.environment = config.environment
    this.baseUrl =
      config.environment === 'production'
        ? 'https://payment.rupantorpay.com/api/payment'
        : 'https://payment.rupantorpay.com/api/payment' // Assuming sandbox might be different or same, but doc says check section 2
  }

  generateSignature(data) {
    // Sort keys to ensure consistent signature if needed
    const sortedKeys = Object.keys(data).sort()
    const signatureString = sortedKeys
      .filter(
        (key) =>
          data[key] !== undefined && data[key] !== null && data[key] !== '',
      )
      .map((key) => `${key}=${data[key]}`)
      .join('&')

    return crypto
      .createHmac('sha256', this.secretKey)
      .update(signatureString)
      .digest('hex')
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

      // Add merchant_id and signature if required by convention, though not explicitly in snippet list
      // We will rely on headers for auth if standard, or body if we find out otherwise.
      // Based on common regional gateways (Aamarpay, etc.), we might need merchant_id in body.
      // But let's try strict adherence to snippet first + standard api-key header.

      const response = await axios.post(`${this.baseUrl}/checkout`, payload, {
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.apiKey, // Assuming API Key auth based on snippet "Header Name"
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
      console.error(
        'RupantorPay init error:',
        error.response?.data || error.message,
      )
      throw new Error('Failed to initialize RupantorPay session')
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
          'api-key': this.apiKey,
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
