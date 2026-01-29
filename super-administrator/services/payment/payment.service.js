// Author: Gururaj
// Created: 31th July 2025
// Description: payment related rervice.
// Version: 1.0.0

const { Payment, OrganizationSubscription, Invoice } = require('../../models');
const { withContext } = require('../../util/helper');
const { Op } = require('sequelize');
const { queryWithLogAudit } = require('../auditLog.service');

// 
class PaymentService {
  static async makePayment({data, req}) {
    const invoice = await Invoice.findOne({
        where: {
            id: data.invoice_id,
            update_expire_time: { [Op.gt]: new Date() },
            status: 'pending',
        },
        });
    if (!invoice) return { success: false, status: 404, message: 'Invalid Invoice or expired',};

    // here payment gateway integration logic would go
    const paymentResult = true;
    const paymentTransferId = Math.random().toString(36).slice(2, 12);
    const paymentGateqay = "Gatewayshould_defnie";
    const responseData = "sldkfhausdhgfisjvklsjahvfgkasdfksjdhfjkasdhvfkxsjc,mvbnliuasdfwe";  

    try {
      data = {
          invoice_id: invoice.id,
          amount: invoice.amount,
          status: paymentResult ? 'success' : 'failed',
          transaction_ref : paymentTransferId, 
          payment_gateway : paymentGateqay,
          response_data: responseData,
          paid_on : new Date(),
          organization_id : invoice.organization_id,
      }

      await Payment.create(data, withContext(req));

      const invoiceUpdateData = {
        status: paymentResult ? 'paid' : 'failed',
        paid_on: new Date(),
        payment_gateway_ref: paymentTransferId,
      };

      const subscriptionUpdateData = { payment: paymentResult ? 'done' : 'failed', };

       //  Update invoice with audit log
      await queryWithLogAudit({
        action: 'update',
        req,
        queryCallBack: (t) => invoice.update(invoiceUpdateData, { ...withContext(req), transaction: t }),
      });

      const subscription = await OrganizationSubscription.findOne({
        where: { id: invoice.subscription_id },
      });

      // Update organization subscription with audit log
      await queryWithLogAudit({
        action: 'update',
        req,
        queryCallBack: (t) =>
          subscription.update(
            subscriptionUpdateData,
            {
              ...withContext(req),
              returning: true,
              transaction: t,
            }
          ),
      });


    } catch (error) {
      console.error('Payment Create Error:', error);
      return { success: false, status: 500, message: 'Payment Failed'};
    }
    return { success: true, status: 201, message: 'Payment created successfully', data: { invoice } };
    
  }
}



module.exports = PaymentService;
