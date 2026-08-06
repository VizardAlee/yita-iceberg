import type { PlatformRole } from "@/lib/domain/roles";

export type GuideProcedure = {
  id: string;
  title: string;
  summary: string;
  href: string;
  action: string;
  prerequisites: string[];
  steps: string[];
  completeWhen: string[];
  escalation?: string;
};

export type RoleDocumentation = {
  dailyStart: string[];
  procedures: GuideProcedure[];
  escalation: string;
};

export const salesFlow = [
  {
    stage: "1",
    role: "Order registrar",
    title: "Register and reserve",
    description:
      "Confirm the customer request, select available branch products, record an approved price, and create the QR-coded order slip. Creating the order reserves its quantity until payment, cancellation, or expiry.",
  },
  {
    stage: "2",
    role: "Cashier",
    title: "Verify and receive payment",
    description:
      "Retrieve the approved order, confirm its customer, products, quantities, and final total, then record the exact payment using the correct methods and evidence. Issue the payment receipt for release verification.",
  },
  {
    stage: "3",
    role: "Release verifier",
    title: "Validate and release",
    description:
      "Match the paid order to its receipt or stamp and physical products. Complete release only after every check passes; this records the sale and permanently deducts the released stock.",
  },
] as const;

export const statusGlossary = [
  {
    term: "Active branch",
    meaning:
      "The branch whose products, queues, inventory, and reports are currently displayed. Confirm it before starting any operation.",
  },
  {
    term: "Available stock",
    meaning:
      "The quantity that can still be added to a new order. It excludes stock already reserved by open orders.",
  },
  {
    term: "Reserved stock",
    meaning:
      "Stock temporarily held by a registered order. It returns to available stock if the order is cancelled or expires before completion.",
  },
  {
    term: "Awaiting approval",
    meaning:
      "The negotiated discount exceeds the automatic branch limit. A manager, admin, or super admin must approve or reject it before payment.",
  },
  {
    term: "Awaiting payment",
    meaning:
      "The order is approved and reserved but no complete payment has been recorded.",
  },
  {
    term: "Paid, awaiting release",
    meaning:
      "Payment is confirmed, but the physical product has not yet passed final release verification.",
  },
  {
    term: "Completed",
    meaning:
      "The customer received the product, the sale is recorded, and inventory has been permanently reduced.",
  },
  {
    term: "Reversal",
    meaning:
      "A controlled correction to a completed sale. It follows approval, refund recording, stock disposition, and audit requirements instead of deleting the original transaction.",
  },
] as const;

export const roleDocumentation: Record<PlatformRole, RoleDocumentation> = {
  order_registrar: {
    dailyStart: [
      "Sign in with your own staff account and confirm your name appears in the header.",
      "Confirm the active branch matches the location where you are serving customers.",
      "Check that the product list is available before accepting the first order.",
    ],
    procedures: [
      {
        id: "registrar-customer",
        title: "Find or register a customer",
        summary:
          "Associate the order with a saved customer or record enough walk-in information to identify the buyer.",
        href: "/customers",
        action: "Open customers",
        prerequisites: [
          "The correct branch is active.",
          "You have the customer's name and a reachable phone number when one is available.",
        ],
        steps: [
          "Open Customers and search by the customer's name or phone number.",
          "Open the matching record and confirm it belongs to the person in front of you.",
          "When no match exists, choose New customer and enter accurate contact details.",
          "Save the customer, then return to order registration.",
          "For a quick walk-in sale, select Walk-in on the order and enter the customer's identifying details there.",
        ],
        completeWhen: [
          "The correct saved customer is selected, or the walk-in name is visible on the order.",
          "The phone number is accurate enough to trace the transaction if support is needed.",
        ],
        escalation:
          "Ask a branch manager before creating a duplicate customer when two records appear to belong to the same person.",
      },
      {
        id: "registrar-order",
        title: "Create an order and reserve stock",
        summary:
          "Build the customer's basket from available branch stock and register a traceable order.",
        href: "/orders/new",
        action: "Create an order",
        prerequisites: [
          "The active branch and customer details are correct.",
          "The requested product and quantity are physically available or confirmed by branch staff.",
        ],
        steps: [
          "Open Order registration and choose Create order.",
          "Find the product by its name, SKU, image, or QR code and choose Add.",
          "Set the requested quantity without exceeding the displayed available stock.",
          "Confirm the customer type and customer details.",
          "Review every line, quantity, locked price, discount, and the final total with the customer.",
          "Choose Create order once. Wait for the success confirmation instead of submitting repeatedly.",
        ],
        completeWhen: [
          "An order number beginning with YI is displayed.",
          "The order appears in Orders and its quantity is shown as reserved stock.",
        ],
        escalation:
          "Stop and ask the manager if displayed stock differs from the physical quantity or if the product cannot be found.",
      },
      {
        id: "registrar-discount",
        title: "Record a negotiated price or discount",
        summary:
          "Apply only the agreed price adjustment and route higher discounts for approval before payment.",
        href: "/orders/new",
        action: "Open order form",
        prerequisites: [
          "The customer and product lines are already selected.",
          "The negotiated amount and business reason have been confirmed.",
        ],
        steps: [
          "Enter the discount in the available amount or percentage control.",
          "Add a clear reason that another staff member can understand without asking you.",
          "Review the new line total and final order total with the customer.",
          "Submit the order. If it exceeds the branch limit, tell the customer that manager approval is required.",
          "Open Orders and wait for Approved before sending the customer to the cashier.",
        ],
        completeWhen: [
          "The exact negotiated value and reason are stored on the order.",
          "The order is approved or remains clearly marked as awaiting approval.",
        ],
        escalation:
          "Never split or recreate an order to avoid approval. Contact the branch manager when a decision is delayed or rejected.",
      },
      {
        id: "registrar-slip",
        title: "Print or reprint the QR order slip",
        summary:
          "Give the customer the document the cashier will use to retrieve and verify the order.",
        href: "/orders",
        action: "Open orders",
        prerequisites: [
          "The order was created successfully.",
          "Any required discount approval has been granted.",
        ],
        steps: [
          "Open Orders and select the order number.",
          "Confirm the customer, items, quantities, and final total one last time.",
          "Open the order slip and choose Print.",
          "Check that the order number and QR code are fully visible on the printed slip.",
          "Hand the slip to the customer and direct them to the cashier.",
        ],
        completeWhen: [
          "The customer has a readable slip for the correct order.",
          "The order remains in the approved payment queue.",
        ],
        escalation:
          "Reprint from the same order when the slip is damaged. Do not create a replacement order unless the original is formally cancelled.",
      },
      {
        id: "registrar-edit",
        title: "Correct or cancel an unpaid order",
        summary:
          "Fix mistakes before payment while preserving the stock reservation and audit trail.",
        href: "/orders",
        action: "Review orders",
        prerequisites: [
          "The order has not been paid or released.",
          "You have confirmed the requested correction with the customer.",
        ],
        steps: [
          "Open Orders and select the order by number or customer name.",
          "Confirm its current status is still editable.",
          "Choose Edit to correct allowed customer, item, quantity, or negotiation details.",
          "Review and save the updated total, then issue a fresh slip.",
          "If the customer abandons the order, use the cancellation action and record a clear reason.",
        ],
        completeWhen: [
          "The latest order details and slip match what the customer will pay.",
          "Cancelled quantities have returned to available stock.",
        ],
        escalation:
          "Once payment exists, stop editing and ask a manager to use the controlled correction or reversal workflow.",
      },
    ],
    escalation:
      "Contact the branch manager for stock mismatches, discount decisions, duplicate customers, paid-order corrections, or any instruction to bypass the registered flow.",
  },
  cashier: {
    dailyStart: [
      "Confirm the active branch matches your till or payment desk.",
      "Verify that the payment queue loads and that the accepted payment channels are available.",
      "Keep transfer references, POS references, and proof documents ready for accurate capture.",
    ],
    procedures: [
      {
        id: "cashier-find",
        title: "Find and verify an order",
        summary:
          "Retrieve the customer's approved order from the queue, QR slip, or order number before accepting money.",
        href: "/cashier",
        action: "Open payment queue",
        prerequisites: [
          "The customer presents a readable order slip or valid order number.",
          "The order belongs to the active branch.",
        ],
        steps: [
          "Open Payments and select the order from the awaiting-payment queue.",
          "If it is not visible, scan the QR code or enter the complete YI order number.",
          "Match the customer's name or phone, product lines, quantities, discounts, and final total to the slip.",
          "Confirm the order is approved, not expired, cancelled, already paid, or awaiting discount approval.",
          "Ask the customer to confirm the amount before beginning payment entry.",
        ],
        completeWhen: [
          "The correct approved order is open in the payment workspace.",
          "The customer agrees with the displayed final amount.",
        ],
        escalation:
          "Send price, quantity, expiry, or customer-detail disputes back to the registrar or branch manager before accepting payment.",
      },
      {
        id: "cashier-payment",
        title: "Record cash, transfer, POS, split, or credit payment",
        summary:
          "Capture the exact settlement using the real payment methods the customer used.",
        href: "/cashier",
        action: "Receive payment",
        prerequisites: [
          "The order passed verification and shows the exact amount due.",
          "Credit and split payment are permitted by the branch when selected.",
        ],
        steps: [
          "Choose the payment method actually received: cash, transfer, POS, credit, or another configured option.",
          "Enter the amount and its transaction or terminal reference when applicable.",
          "For split payment, add each payment line separately until the combined amount equals the order total.",
          "For credit, enter the required customer and due-date information and confirm branch policy allows it.",
          "Review all lines and confirm payment only when the difference is zero.",
        ],
        completeWhen: [
          "The recorded payment total exactly matches the amount due.",
          "The order status changes to paid and awaiting release.",
        ],
        escalation:
          "Do not mark an underpayment as complete. Ask a manager about overpayments, failed terminals, unsupported credit, or mismatched references.",
      },
      {
        id: "cashier-proof",
        title: "Capture transfer or payment evidence",
        summary:
          "Preserve the reference or proof needed to confirm a non-cash transaction.",
        href: "/cashier",
        action: "Open payments",
        prerequisites: [
          "The transfer or POS transaction is visible in an approved business channel.",
          "The branch requires proof for the selected payment method.",
        ],
        steps: [
          "Confirm the received amount, sender or terminal details, reference, and transaction time.",
          "Enter the reference exactly as shown by the bank or terminal.",
          "Attach the required proof when the payment form requests it.",
          "Check that the uploaded evidence is readable and belongs to this order.",
          "Save the payment only after independent confirmation that funds were received.",
        ],
        completeWhen: [
          "The payment line contains a valid reference and any required proof.",
          "Another authorized staff member can verify the evidence from the transaction record.",
        ],
        escalation:
          "Do not rely only on a customer's screenshot. Ask the branch manager when funds cannot be independently confirmed.",
      },
      {
        id: "cashier-receipt",
        title: "Issue or reprint the payment receipt",
        summary:
          "Give the customer the verified payment document needed at product release.",
        href: "/cashier",
        action: "Open payment queue",
        prerequisites: [
          "The payment confirmation completed successfully.",
          "The order is marked paid and awaiting release.",
        ],
        steps: [
          "Open the completed payment record for the order.",
          "Confirm its order number, customer, paid amount, payment methods, and cashier name.",
          "Print the receipt and apply any required physical stamp or validation mark.",
          "Check that the QR code and order number remain readable.",
          "Hand the receipt to the customer and direct them to release verification.",
        ],
        completeWhen: [
          "The customer holds a valid receipt for the same order shown as paid.",
          "The order is visible in the release queue.",
        ],
        escalation:
          "Reprint from the existing payment record when needed. Never record payment twice to generate another receipt.",
      },
    ],
    escalation:
      "Contact the branch manager for disputed totals, unavailable payment channels, unconfirmed transfers, credit exceptions, duplicate payments, or orders missing from the queue.",
  },
  release_verifier: {
    dailyStart: [
      "Confirm the active branch is your physical release point.",
      "Check that the paid-order release queue loads before accepting receipts.",
      "Make sure products can be identified by name, SKU, image, and physical quantity.",
    ],
    procedures: [
      {
        id: "release-find",
        title: "Retrieve a paid order",
        summary:
          "Open the exact paid transaction associated with the customer's receipt or QR code.",
        href: "/release",
        action: "Open release queue",
        prerequisites: [
          "The customer presents the cashier receipt or valid order number.",
          "The order was paid at the active branch.",
        ],
        steps: [
          "Open Release verification and select the order from the paid queue.",
          "If it is not visible, scan the receipt QR code or enter the full order number.",
          "Confirm the retrieved record belongs to the same branch and customer.",
          "Check that its status is paid and awaiting release.",
          "Keep the record open while validating the receipt and physical items.",
        ],
        completeWhen: [
          "The exact paid order is displayed for verification.",
          "No cancellation, reversal, or prior release warning is present.",
        ],
        escalation:
          "Do not release from a screenshot or verbal order number when the transaction cannot be retrieved. Ask the manager to investigate.",
      },
      {
        id: "release-payment",
        title: "Validate payment and receipt",
        summary:
          "Confirm that the system payment, printed receipt, QR code, and any required stamp all describe the same transaction.",
        href: "/release",
        action: "Review releases",
        prerequisites: [
          "The paid order is open.",
          "The original receipt or approved digital equivalent is available.",
        ],
        steps: [
          "Match the order number on screen and on the receipt.",
          "Compare the customer, total paid, payment status, and cashier details.",
          "Inspect the required stamp, validation mark, or payment evidence.",
          "Reject the handover if the receipt is altered, duplicated, mismatched, or the order is not fully paid.",
          "Continue only after every payment check is valid.",
        ],
        completeWhen: [
          "The system confirms full payment for the same receipt and order.",
          "The receipt or stamp meets the branch's release requirements.",
        ],
        escalation:
          "Hold the product and contact the cashier or manager when payment or receipt validity is uncertain.",
      },
      {
        id: "release-items",
        title: "Match and hand over products",
        summary:
          "Use the order details and product images to release the right physical items and quantities.",
        href: "/release",
        action: "Verify products",
        prerequisites: [
          "Payment and receipt checks have passed.",
          "The complete physical order is ready at the release point.",
        ],
        steps: [
          "Read each product name, SKU, and ordered quantity from the release record.",
          "Use the product image as an identification aid, then verify the physical product label or specification.",
          "Count every unit in front of the customer.",
          "Ask the customer to confirm the items and quantities received.",
          "Do not substitute a different product without a corrected order and payment record.",
        ],
        completeWhen: [
          "Every physical item and quantity matches the paid order.",
          "The customer confirms the handover is correct.",
        ],
        escalation:
          "Stop the release and ask the manager to resolve missing, damaged, substituted, or physically unavailable stock.",
      },
      {
        id: "release-complete",
        title: "Complete the release and sale",
        summary:
          "Record the final handover so the sale closes and reserved stock becomes a permanent stock-out.",
        href: "/release",
        action: "Open release queue",
        prerequisites: [
          "The payment, receipt, product, and customer checks all passed.",
          "The physical goods have been counted and are ready to leave the branch.",
        ],
        steps: [
          "Review the final release confirmation on screen.",
          "Choose Complete release once, at the moment the goods are handed over.",
          "Wait for the success confirmation and completed status.",
          "Return the receipt to the customer when branch procedure requires it.",
          "Confirm the order leaves the pending release queue.",
        ],
        completeWhen: [
          "The order status is completed and the sale appears in reports.",
          "Inventory reflects the permanent stock deduction.",
        ],
        escalation:
          "If completion fails, retain the goods and contact the manager. Do not repeatedly release or use another order.",
      },
    ],
    escalation:
      "Contact the branch manager for mismatched receipts, uncertain payment, missing products, physical stock differences, damaged goods, or a failed completion action.",
  },
  branch_manager: {
    dailyStart: [
      "Select the branch you are supervising and review dashboard alerts and pending queues.",
      "Check awaiting discount approvals, unpaid orders, paid unreleased orders, and low-stock items.",
      "Confirm that registrar, cashier, and release staff have the correct branch access.",
    ],
    procedures: [
      {
        id: "manager-discounts",
        title: "Approve or reject a negotiated discount",
        summary:
          "Make a controlled price decision using the order value, reason, branch policy, and available margin information.",
        href: "/orders",
        action: "Review orders",
        prerequisites: [
          "The order is marked awaiting approval.",
          "The registrar recorded a clear negotiation reason.",
        ],
        steps: [
          "Open Orders and filter or locate orders awaiting discount approval.",
          "Open the order and review customer, products, standard total, proposed discount, final total, and reason.",
          "Check the branch discount limit and any cost or margin information your role is allowed to see.",
          "Choose Approve when the price is authorized, or Reject and record a clear explanation.",
          "Confirm the status updates so the registrar and cashier can see the decision.",
        ],
        completeWhen: [
          "The decision, manager identity, time, and reason are recorded.",
          "Approved orders can proceed to payment; rejected orders return for correction or cancellation.",
        ],
        escalation:
          "Refer exceptional prices or policy conflicts to an admin rather than approving outside your authority.",
      },
      {
        id: "manager-pos",
        title: "Monitor and support the three-stage POS flow",
        summary:
          "Keep orders moving through registration, payment, and release without removing separation-of-duty controls.",
        href: "/dashboard",
        action: "Open dashboard",
        prerequisites: [
          "The correct branch is selected.",
          "You understand which staff member owns each open transaction stage.",
        ],
        steps: [
          "Review dashboard counts for unpaid, paid unreleased, completed, and exception transactions.",
          "Open Orders to resolve approval, expiry, or reservation issues.",
          "Open Payments to investigate queue or settlement problems.",
          "Open Release verification to investigate paid orders waiting too long for handover.",
          "Step into a workflow only when operational support is required, and leave clear audit reasons for exceptional actions.",
        ],
        completeWhen: [
          "Queues are current and exceptions have a named owner.",
          "No product is released without an approved order and confirmed payment.",
        ],
        escalation:
          "Escalate company-wide settings, cross-branch access, or unexplained system failures to an admin or super admin.",
      },
      {
        id: "manager-receive-stock",
        title: "Receive allocated stock into the branch",
        summary:
          "Record physical stock received so the branch quantity and movement history remain accurate.",
        href: "/inventory/receipts/new",
        action: "Receive stock",
        prerequisites: [
          "The delivery or allocation has been physically counted.",
          "The product already exists in the catalog and is configured for the branch.",
        ],
        steps: [
          "Open Inventory and choose Receive stock.",
          "Select the product and confirm its name, SKU, and image.",
          "Enter the received quantity, source, reference, and notes.",
          "Compare the entry to the physical count and supporting document.",
          "Submit the receipt and confirm the on-hand quantity increases by the expected amount.",
        ],
        completeWhen: [
          "The receipt appears in stock movements with the correct reference.",
          "Branch on-hand and available quantities reflect the accepted delivery.",
        ],
        escalation:
          "Do not force the expected quantity when the physical count differs. Record or report the discrepancy to an admin.",
      },
      {
        id: "manager-count",
        title: "Run a stock count or controlled adjustment",
        summary:
          "Compare system stock to physical stock and resolve differences through an auditable process.",
        href: "/inventory/counts/new",
        action: "Start stock count",
        prerequisites: [
          "Stock movement is paused or controlled for the count area.",
          "A second person is available when branch procedure requires independent verification.",
        ],
        steps: [
          "Open Inventory counts and start a new count for the active branch.",
          "Count each physical product without relying on the expected number first.",
          "Enter the counted quantity and recount every variance.",
          "Submit the count with notes explaining known damage, loss, or timing differences.",
          "Use the adjustment workflow for an authorized correction and retain supporting evidence.",
        ],
        completeWhen: [
          "Every counted product has a recorded result and variance status.",
          "Approved adjustments create stock movements and audit records instead of rewriting history.",
        ],
        escalation:
          "Escalate material or unexplained shortages, repeated variances, and suspected misuse to an admin immediately.",
      },
      {
        id: "manager-reversal",
        title: "Review a reversal, return, or refund",
        summary:
          "Correct a completed sale while preserving the original transaction and controlling stock and money outcomes.",
        href: "/reversals",
        action: "Open reversals",
        prerequisites: [
          "The original completed order and customer request have been identified.",
          "Returned products have been inspected and their stock disposition is known.",
        ],
        steps: [
          "Open Reversals and select or create the request against the original order.",
          "Review the reason, affected items, quantities, payment history, and supporting evidence.",
          "Choose whether each returned item is restockable, damaged, or not returned.",
          "Approve or reject within your authority and record the refund method, amount, reference, and date when applicable.",
          "Verify that reports, refund records, and stock movements reflect the completed decision.",
        ],
        completeWhen: [
          "The original sale remains visible with a linked reversal record.",
          "Refund and inventory effects match the approved outcome.",
        ],
        escalation:
          "Refer high-value, cross-branch, suspicious, or policy-exception reversals to an admin.",
      },
      {
        id: "manager-reports",
        title: "Review branch performance and close the day",
        summary:
          "Use authorized reports to reconcile activity and identify unresolved operational risk.",
        href: "/reports",
        action: "Open reports",
        prerequisites: [
          "The correct branch and reporting date range are selected.",
          "All known pending transactions have an explanation.",
        ],
        steps: [
          "Open Reports and set the required date range.",
          "Compare sales, payment methods, completed orders, unpaid orders, and paid unreleased orders.",
          "Review inventory movements, low-stock alerts, reversals, credits, and staff activity.",
          "Investigate unusual totals or long-running queue items before closing the shift.",
          "Export the required report and retain it according to company procedure.",
        ],
        completeWhen: [
          "Cashier settlements and operational totals are explained.",
          "Outstanding exceptions are resolved or assigned for follow-up.",
        ],
        escalation:
          "Send unexplained financial differences, access concerns, or recurring system errors to an admin with order numbers and evidence.",
      },
    ],
    escalation:
      "Contact an admin for company policy exceptions, cross-branch changes, staff access, large or suspicious losses, and any action outside assigned branches.",
  },
  admin: {
    dailyStart: [
      "Review company-wide dashboard alerts, failed operations, and branch selection before changing data.",
      "Confirm that branches, staff assignments, product availability, and operational queues are healthy.",
      "Use normal staff accounts for routine counter work when possible and reserve admin actions for oversight or exception handling.",
    ],
    procedures: [
      {
        id: "admin-branches",
        title: "Create and configure a branch",
        summary:
          "Establish a location and its operating controls before assigning staff or stock.",
        href: "/branches",
        action: "Manage branches",
        prerequisites: [
          "You have the official branch name, address, contact details, and responsible manager.",
          "Company policy defines discount, payment proof, split payment, credit, and order expiry rules.",
        ],
        steps: [
          "Open Branches and choose Create branch.",
          "Enter the official identity and contact information.",
          "Set order expiry, discount thresholds, payment-proof requirements, split-payment, and credit controls.",
          "Review the configuration, create the branch, and confirm it appears in the branch selector.",
          "Assign staff and allocate stock only after the branch is active and verified.",
        ],
        completeWhen: [
          "The branch appears as active with the intended controls.",
          "Its manager, staff, and stock can be assigned without permission errors.",
        ],
        escalation:
          "Ask a super admin to investigate a branch that cannot be created or appears with inconsistent platform access.",
      },
      {
        id: "admin-products",
        title: "Create a product with an image and allocate stock",
        summary:
          "Add a recognizable catalog record, receive central allocation quantity, and distribute stock to branches.",
        href: "/catalog/products",
        action: "Open product catalog",
        prerequisites: [
          "You have the approved product name, selling price, cost controls, and a clear image.",
          "You know the total quantity being received and the quantity intended for each branch.",
        ],
        steps: [
          "Open Product catalog and choose New product.",
          "Enter the product details; the system generates the SKU and QR code automatically.",
          "Add a clear primary product image so staff can identify it during ordering and release.",
          "Save the product, open branch product setup, and receive the total allocation quantity into the stock pool.",
          "Allocate quantities to individual branches without exceeding the remaining total, then verify each branch inventory view.",
        ],
        completeWhen: [
          "The catalog shows the product, generated SKU, QR code, price, and image.",
          "The total allocated quantity equals the branch distributions plus any unallocated balance.",
        ],
        escalation:
          "Stop allocation when totals do not reconcile. Correct receipts or movements through their proper workflow instead of editing quantities directly.",
      },
      {
        id: "admin-access",
        title: "Invite a user and assign access",
        summary:
          "Create a staff identity, assign the least access needed, and share a controlled password setup link.",
        href: "/access",
        action: "Manage access",
        prerequisites: [
          "The user's full name, unique email, phone, role, and branch assignments are approved.",
          "Operational branches already exist.",
        ],
        steps: [
          "Open Access management and complete the invite form.",
          "Choose the correct role and assign every branch the user needs, but no more.",
          "Generate the invite, copy the password setup link, and send it privately to the intended user.",
          "Ask the user to set a password, sign in, and confirm their role and active branch.",
          "If the link expires, use Generate new setup link on the existing user; do not create a duplicate account.",
        ],
        completeWhen: [
          "The user can sign in and sees only their authorized workflows and branches.",
          "The invitation and any regenerated setup link are recorded in the audit trail.",
        ],
        escalation:
          "Only a super admin can create or assign super-admin access. Escalate suspicious or unauthorized access immediately.",
      },
      {
        id: "admin-direct-sale",
        title: "Administer a direct sale",
        summary:
          "Complete an exceptional sale from one controlled workspace while preserving each order, payment, release, and stock record.",
        href: "/orders/direct",
        action: "Open direct sale",
        prerequisites: [
          "There is a valid business reason for an admin to handle the complete workflow.",
          "The customer, stock, price, payment, and physical handover can all be verified.",
        ],
        steps: [
          "Open Direct sale and select the correct branch and customer.",
          "Add products and quantities, then review any negotiated price and approval implications.",
          "Record the actual payment methods, references, and required evidence.",
          "Verify the products and customer handover before completing release.",
          "Confirm the completed order appears in reports and the inventory deduction is correct.",
        ],
        completeWhen: [
          "A complete linked order, payment, release, stock movement, and audit history exists.",
          "The customer receives the correct final receipt and products.",
        ],
        escalation:
          "Do not use direct sale to hide missing staff, bypass unresolved approvals, or correct an already completed sale. Use access management or reversals instead.",
      },
      {
        id: "admin-oversight",
        title: "Review company reports, finances, and exceptions",
        summary:
          "Monitor every branch with adjustable date ranges, charts, detailed reports, and audit evidence.",
        href: "/reports",
        action: "Open reports",
        prerequisites: [
          "The required reporting period and branch scope are known.",
          "Sensitive exports will be handled according to company policy.",
        ],
        steps: [
          "Open Reports or the dashboard and select All branches or one branch.",
          "Set the date range and compare sales, order status, payment mix, inventory value, and trend charts.",
          "Open detailed sales, payment, inventory, credit, reversal, and staff activity reports as needed.",
          "Investigate abnormal discounts, reversals, stock adjustments, unpaid orders, and paid unreleased orders.",
          "Export only the necessary date range and retain or share the file securely.",
        ],
        completeWhen: [
          "Material financial and stock differences have an explanation and accountable owner.",
          "Exceptions are resolved, approved, or formally assigned for follow-up.",
        ],
        escalation:
          "Escalate platform-wide failures, privileged access concerns, and suspected data integrity issues to a super admin.",
      },
      {
        id: "admin-reversal",
        title: "Control a completed-sale reversal",
        summary:
          "Authorize the financial and stock correction while keeping the original sale immutable and traceable.",
        href: "/reversals",
        action: "Manage reversals",
        prerequisites: [
          "The original order, payment, customer request, returned products, and evidence have been verified.",
          "The refund method and stock disposition are approved.",
        ],
        steps: [
          "Open Reversals and inspect the linked original sale and prior reversal activity.",
          "Review the reason, items, quantities, evidence, and manager recommendation.",
          "Approve or reject the request with a complete audit reason.",
          "Record the actual refund amount, method, date, and reference.",
          "Verify that restockable goods return through stock movements and damaged goods remain excluded from available stock.",
        ],
        completeWhen: [
          "The original sale and linked reversal are both visible in reports.",
          "Refund totals and inventory movements match the approved outcome.",
        ],
        escalation:
          "Ask a super admin to review suspicious privileged actions, repeated reversals, or platform inconsistencies.",
      },
    ],
    escalation:
      "Contact a super admin for super-admin access changes, platform recovery, persistent permission failures, audit concerns, and company-wide data integrity issues.",
  },
  super_admin: {
    dailyStart: [
      "Review platform health, failed operations, privileged access, audit activity, and company-wide exceptions.",
      "Confirm admins retain the access needed to operate while super-admin accounts remain limited and protected.",
      "Use audited application workflows for business changes; reserve cloud-console access for platform operations.",
    ],
    procedures: [
      {
        id: "super-company-setup",
        title: "Validate the complete company setup",
        summary:
          "Confirm branches, controls, catalog, stock, roles, and reporting form a usable end-to-end operation.",
        href: "/branches",
        action: "Review branches",
        prerequisites: [
          "The company owner has approved operating rules and branch responsibilities.",
          "At least one test account exists for each operational role being used.",
        ],
        steps: [
          "Review every branch identity and workflow control.",
          "Review product records, images, SKU and QR generation, stock receipts, and branch allocations.",
          "Review admins, managers, operational users, and branch assignments.",
          "Run a controlled test through registration, payment, release, inventory deduction, reports, and reversal.",
          "Resolve permission, configuration, or data issues before declaring the setup operational.",
        ],
        completeWhen: [
          "Every active role can complete its authorized workflow without permission errors.",
          "The test transaction reconciles across order, payment, inventory, report, and audit records.",
        ],
        escalation:
          "Use the documented cloud operations process for infrastructure failures and preserve logs before changing configuration.",
      },
      {
        id: "super-access",
        title: "Manage privileged access and replacement setup links",
        summary:
          "Maintain admin and super-admin access without creating duplicate identities or weakening role controls.",
        href: "/access",
        action: "Manage privileged access",
        prerequisites: [
          "The company owner has approved the privileged user and scope.",
          "The user's identity and unique email have been independently confirmed.",
        ],
        steps: [
          "Open Access management and review existing records before creating a user.",
          "Assign admin for company ownership duties and super admin only for platform administration.",
          "Generate and privately share the password setup link.",
          "When a link expires, generate a new link from the existing user row without changing role or branch assignments.",
          "Review the audit event and verify successful sign-in, then deactivate access promptly when it is no longer required.",
        ],
        completeWhen: [
          "The user has exactly one active identity with the approved role and scope.",
          "Invite, replacement-link, role, and activation changes are auditable.",
        ],
        escalation:
          "Treat an unexpected privileged user or unexplained role change as a security incident and preserve audit evidence.",
      },
      {
        id: "super-admin-workflows",
        title: "Support every operational and admin workflow",
        summary:
          "Use ultimate application access to diagnose issues while keeping the owner and operational roles responsible for routine work.",
        href: "/dashboard",
        action: "Open dashboard",
        prerequisites: [
          "The affected user, branch, order number, exact action, time, and error have been collected.",
          "A lower-privilege role cannot resolve the issue through its normal workflow.",
        ],
        steps: [
          "Select the affected branch and reproduce only the minimum necessary step.",
          "Inspect the related order, payment, release, stock, reversal, user, or report record.",
          "Correct configuration through the app when an audited control exists.",
          "Avoid deleting or rewriting transaction history; use cancellation, adjustment, refund, and reversal workflows.",
          "Confirm the original user can resume work and document what was changed.",
        ],
        completeWhen: [
          "The affected workflow works for its intended role and branch.",
          "Every corrective action has a visible business or audit record.",
        ],
        escalation:
          "Move to cloud logs and deployment diagnostics only when application records cannot explain the failure.",
      },
      {
        id: "super-audit",
        title: "Review audit activity and investigate exceptions",
        summary:
          "Trace sensitive user, inventory, pricing, payment, and reversal actions across the platform.",
        href: "/reports",
        action: "Open reports",
        prerequisites: [
          "The investigation scope, period, branches, users, or transaction identifiers are known.",
          "Evidence access is restricted to authorized reviewers.",
        ],
        steps: [
          "Set the report branch scope and date range.",
          "Review staff activity alongside sales, discounts, payments, stock movements, reversals, and access changes.",
          "Correlate events by user name, order number, timestamp, and branch.",
          "Export only the evidence needed and store it securely.",
          "Record remediation, access changes, or follow-up ownership without deleting the source records.",
        ],
        completeWhen: [
          "The event sequence, responsible identities, and data effects are understood.",
          "Required corrective and security actions have named owners and evidence.",
        ],
        escalation:
          "Use the incident response and cloud operations process for suspected credential compromise, data exposure, or infrastructure intrusion.",
      },
      {
        id: "super-recovery",
        title: "Handle platform recovery and deployment checks",
        summary:
          "Restore service through controlled credentials, monitoring, verification, and deployment procedures.",
        href: "/dashboard",
        action: "Return to dashboard",
        prerequisites: [
          "The failure has been confirmed and relevant browser, function, App Hosting, or audit logs are available.",
          "You have authorized cloud access and a known-good source revision.",
        ],
        steps: [
          "Identify whether the problem is authentication, App Check, permissions, functions, App Hosting, Firestore, Storage, or application code.",
          "Check monitoring alerts and logs using the affected order, user, time, or request details.",
          "Apply the smallest authorized configuration or code correction and keep credentials out of the repository.",
          "Run type, lint, rule, build, and targeted workflow checks before deployment.",
          "Deploy, verify the live domain and all role workflows, then remove temporary elevated cloud permissions.",
        ],
        completeWhen: [
          "The live service works on the custom domain for affected and unaffected roles.",
          "Monitoring is healthy, temporary privileges are removed, and the deployed revision is recorded.",
        ],
        escalation:
          "Pause changes and involve the cloud project owner when recovery requires destructive actions, unknown credentials, or policy changes beyond approved authority.",
      },
    ],
    escalation:
      "Escalate suspected compromise, data loss, destructive recovery, billing suspension, or project ownership issues to the cloud project owner and preserve all available evidence.",
  },
};
