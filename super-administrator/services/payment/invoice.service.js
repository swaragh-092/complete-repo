// Author: Gururaj
// Created: 31th July 2025
// Description: Invoice related rervice.
// Version: 1.0.0

const { GlobalSetting, Invoice, InvoiceCounter } = require("../../models");
const { withContext } = require("../../util/helper");
const { queryWithLogAudit } = require("../auditLog.service");

// generate invoice number
// INV-ORG-GOOG-20250729-8DB617F7-20250729-0002
// INV-organization-code_________-yyyyddmm-number
function generateInvoiceNumber(org, count) {
  const orgCode = org.code || "XXXX"; // fallback if code missing
  const datePart = new Date().toISOString().split("T")[0].replace(/-/g, "");
  return `INV-${orgCode.toUpperCase()}-${datePart}-${String(count).padStart(4, "0")}`;
}

async function getNextInvoiceCount(organization_id) {
  const today = new Date().toISOString().split("T")[0]; // 'YYYY-MM-DD'

  let counter = await InvoiceCounter.findOne({
    where: { organization_id, date: today },
  });

  if (counter) {
    counter.count += 1;
    await counter.save();
  } else {
    counter = await InvoiceCounter.create({
      organization_id,
      date: today,
      count: 1,
    });
  }

  return counter.count;
}

class InvoiceService {

  async create({data, req}) {
    if (!data.organization || !data.subscription || !data.plan || !req) {
      return { success: false, status: 422, message: "Insufficient data for invoice." };
    }

    try {
      const today = new Date();
      const issueDate = today;
      const globalSetting = await GlobalSetting.findOne({
            where: { key: 'invoice_update_expire_time' },
            attributes: ['value'],
            raw: true,
        });
      const updateExpireTime = new Date(new Date(today).getTime() + (parseInt(globalSetting?.value || '15') * 60 * 1000));

      const count = await getNextInvoiceCount(data.organization.id);
      const invoiceNumber = generateInvoiceNumber(data.organization, count);

      const invoiceData = {
        organization_id: data.organization.id,
        subscription_id: data.subscription.id,
        invoice_number: invoiceNumber,
        update_expire_time: updateExpireTime,
        amount: data.plan.price,
        currency: data.plan.currency,
        status: 'pending',
        issue_date: issueDate,
        payment_gateway_ref: data.payment_gateway_ref || null,
      };

      const invoice = await queryWithLogAudit({
        action: 'create',
        req,
        queryCallBack: (t) => Invoice.create(invoiceData, { ...withContext(req), transaction: t }),
      });


      return {
        success: true,
        status: 201,
        message: 'Invoice created successfully',
        data: invoice,
      };
    } catch (err) {
      console.error('Invoice Create Error:', err);
      return {
        success: false,
        status: 500,
        message: 'Failed to create invoice',
        error: err.message,
      };
    }
  }

}

module.exports = new InvoiceService();

