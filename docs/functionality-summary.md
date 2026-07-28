# YITA Iceberg - Application Functionality Summary

Last updated: 28 July 2026

## 1. Purpose

YITA Iceberg is a secure, multi-branch ice-block production, inventory, sales-control, point-of-sale, and financial-oversight application. It tracks ice blocks and related products from central stock receipt and branch allocation through customer ordering, payment, controlled dispatch, completed sale, reporting, and any later correction or reversal.

The standard sale deliberately separates responsibilities:

```text
Order Registrar -> Cashier -> Release Verifier
Create and reserve -> Confirm payment -> Verify and complete
```

This separation prevents one operational user from creating an order, accepting its payment, and releasing its stock without independent checks. Company administrators can oversee every workflow, while the super-admin role retains ultimate platform and developer-level access.

## 2. Roles And Access

| Role | Scope | Main capabilities |
| --- | --- | --- |
| Order registrar | Assigned branches | View sellable branch products, manage customers, create and edit unpaid orders, negotiate prices within policy, request discount approval, print order slips, and cancel eligible unpaid orders |
| Cashier | Assigned branches | View the payment queue, find orders by order number, manage customers, verify order details, record cash/transfer/POS/credit or split payments, attach transfer proof, and print payment receipts |
| Release verifier | Assigned branches | View the release queue, validate the order QR or use a reasoned manual fallback, confirm payment/stamp validity, complete product release, and print release confirmation |
| Branch manager | Assigned branches | Access all three operational stages for assigned branches, review branch activity, manage branch pricing/settings, receive stock, request adjustments, run stock counts, approve or reject discounts, and manage reversal requests |
| Admin | All branches | Operate and oversee every company workflow, create branches, invite and manage staff, manage catalog and central stock, approve inventory controls, view sensitive financials and all-branch reports, complete reversals, and use the direct-sale workflow |
| Super-admin | All branches | Ultimate access to all admin and operational capabilities, including assigning super-admin access and performing platform-level administration |

Admin and super-admin permissions are inherited across the operational workflows. A regular admin cannot create or assign another super-admin; only an existing super-admin can do that.

## 3. Authentication And Staff Management

- There is no public sign-up flow. Staff accounts are created by an admin or super-admin.
- The inviter enters the staff member's name, email, optional phone number, role, and branch assignment.
- The system creates or updates the Firebase Authentication account and the corresponding staff profile.
- A secure password-setup link is generated for the inviter to copy and share manually with the invited user.
- If a setup link expires, an authorized admin can generate a replacement link for the existing active user without changing the user's role or branch assignments.
- Operational staff must be assigned to at least one branch.
- Admins can update roles and branch assignments, deactivate users, and reactivate users.
- The access screen shows active and inactive registered staff.
- Every signed-in user must have an active Firestore user profile as well as a valid Firebase account.
- Successful sign-in creates an HTTP-only application session and sends the user to the dashboard.
- The profile screen shows the user's personal details, role, status, and branch assignments.

## 4. Branch Management

- Admins and super-admins can create branches from the application.
- Every branch has a unique code, display name, active status, and operational settings.
- Branch settings can require a reason for discounts.
- Branch settings can require evidence for bank-transfer payments.
- Credit sales and split payments can be enabled or disabled per branch.
- Admins can work in a selected branch or use all-branch context where the feature supports it.
- Operational users can access only their assigned active branches.
- The active branch selector controls the current working context, while every protected server action independently verifies branch access.

## 5. Product Catalog

- Admins and super-admins can create, edit, view, and archive products.
- Product records support a name, description, category, unit, and identifying codes.
- The system automatically generates a unique SKU for a new product.
- The system automatically generates a scannable product QR code.
- Product QR labels can be previewed and printed without printing the surrounding page.
- Each product can have an identifying JPEG, PNG, or WebP image of up to 5 MB.
- Product images are displayed in the catalog and operational product-selection views to reduce identification mistakes.
- Product image uploads are restricted to administrators, while authenticated operational staff can view the images they need.
- Archiving preserves historical references instead of deleting a product used by past transactions.

Creating a catalog product defines what the business sells. It does not create branch stock by itself.

## 6. Central Stock And Branch Allocation

- New physical stock can be received into the central allocation pool.
- The allocation view shows the total central quantity available for each product.
- An admin selects a branch and allocates a chosen quantity from central stock to that branch.
- An allocation cannot exceed the quantity available in the central pool.
- Each branch keeps a separate quantity for the same product.
- Branch product setup connects a catalog product to a branch and defines its selling controls.
- A branch product supports selling price, minimum permitted price, default cost, and reorder level.
- Reallocating stock updates both the allocation pool and the destination branch in a controlled transaction.

The central allocation model keeps product definition separate from physical quantity and makes branch quantities explicit.

## 7. Inventory Management

### Inventory Overview

- Shows products stocked in the active branch.
- Displays on-hand, reserved, available, sold, reversed, returned, damaged, and reorder quantities where applicable.
- Available quantity is calculated as:

```text
available quantity = on-hand quantity - reserved quantity
```

- Highlights low-stock products using the configured reorder level.
- Provides product-level stock details and movement history.

### Stock Receipts

- Authorized users can record branch stock receipts with supplier, delivery reference, notes, products, quantities, and unit costs.
- Admins can record receipts into the central allocation pool.
- Branch managers can record receipts for branches they manage.
- Receipt processing updates quantities and weighted-average inventory valuation transactionally.

### Inventory Adjustments

- Branch managers can request increases, decreases, or damage write-offs with a reason.
- Administrators approve or reject adjustment requests.
- Approved adjustments update inventory, valuation, stock movements, and audit history together.
- An adjustment cannot reduce stock below existing reservations or produce negative stock.

### Stock Counts

- Branch managers can start and submit physical stock counts.
- Counts compare expected and counted quantities for the selected products.
- Administrators approve or reject submitted counts.
- Approved differences create the required stock and valuation corrections with a complete audit trail.

### Valuation And Controls

- Inventory uses weighted-average cost valuation.
- Cost and stock-value fields are protected from ordinary operational roles.
- Admins and super-admins can view company stock value and average unit cost.
- Branch managers can manage authorized branch pricing and reorder settings without receiving unrestricted company-wide financial access.

## 8. Customer Management

- Order registrars, cashiers, branch managers, admins, and super-admins can create and update customer records within their branch scope.
- Orders can be created for a registered customer or a walk-in customer.
- Walk-in orders capture a name and optional contact details on the order.
- Registered customers support contact details, credit limit, outstanding balance, and active status.
- Customer names are resolved in operational and reporting views instead of exposing internal customer IDs.
- Credit transactions update the registered customer's outstanding balance.

## 9. Standard Three-Step Sales Workflow

### Stage 1 - Order Registration

1. The registrar selects the active branch.
2. The app loads active branch products with available quantities, prices, SKUs, and images.
3. The registrar selects a registered customer or enters walk-in customer details.
4. Products and quantities are added to the cart.
5. Staff may negotiate a selling price, subject to the protected minimum-price and discount rules.
6. A price requiring approval is submitted to a branch manager, admin, or super-admin with the required reason.
7. The server recalculates authoritative totals and validates the branch, product status, price, stock, and role.
8. Creating the order reserves its quantities immediately.
9. The app generates an order number, secure QR token, and printable order slip.

Eligible unpaid orders can be edited or cancelled. Editing recalculates reservations safely. Cancellation releases the reserved quantities. Stale unpaid reservations can also be expired automatically.

### Stage 2 - Payment Confirmation

1. The cashier sees the branch payment queue or searches using the order number from the slip.
2. The cashier verifies the customer, items, quantities, approved discount, and total.
3. Payment is recorded using one or more allowed payment methods.
4. The server validates that payment lines equal the authoritative order total.
5. The order moves to the release queue.
6. A printable payment receipt is generated.

Supported payment methods are:

- Cash
- Bank transfer
- POS terminal
- Credit
- Split payment using multiple methods

Bank-transfer evidence can be required by branch policy. The upload flow accepts supported image or PDF proof of up to 10 MB through a server-authorized upload intent. Payment records capture the receiving cashier, references, evidence state, and time.

### Stage 3 - Release Verification

1. The release verifier opens the paid-order queue.
2. The order slip QR is scanned or pasted.
3. The server validates the order number, QR token, payment state, branch, and current order status.
4. A manual fallback is available when scanning is not possible, but it requires a reason.
5. The verifier confirms that the payment and physical stamp/evidence are valid.
6. Completing release deducts stock, clears reservations, records the sale and valuation movement, and marks the order completed.
7. A release confirmation can be printed.

Inventory is not deducted permanently when the order is merely registered or paid. Final deduction happens only when release is completed.

## 10. Discount Control

- Staff can negotiate product prices instead of being limited to a single fixed selling price.
- The branch product's minimum price remains a protected server-side control.
- The system calculates the discount from the authoritative configured selling price.
- A branch can require a written discount reason.
- Discounts requiring review enter an approval state.
- Branch managers, admins, and super-admins can review, approve, or reject discount requests within their allowed branch scope.
- Approval records the reviewer, decision, reason, price effect, and time in the audit trail.
- A cashier cannot confirm payment for an order whose required discount approval is still pending.

## 11. Administrator Direct Sale

Admins and super-admins have an additional **Administer sale** workflow for exceptional situations where the company owner needs to bypass the normal handoff between three staff members.

- The administrator selects the branch, customer, products, quantities, prices, and payment lines.
- A mandatory administrative reason explains why the standard workflow was bypassed.
- The server still enforces product status, branch access, available stock, minimum prices, payment totals, credit rules, and split-payment settings.
- Order creation, payment confirmation, release, stock deduction, valuation, finance records, and audit records are completed atomically.
- The completed order is visibly marked as an administrator-directed sale.

This is a controlled shortcut, not a way around stock, price, payment, or audit protections.

## 12. Receipts, QR Codes, And Printing

- Product QR codes identify catalog products and can be printed as focused labels.
- Order QR codes use a secure token tied to the order number.
- Only a hash of the sensitive order QR token is stored; reissuing a QR rotates the token.
- The order slip contains the customer/order information and QR needed by later stations.
- The cashier receipt records confirmed payment lines.
- The release confirmation records the final verifier and completion.
- Print styles isolate the intended slip, receipt, confirmation, or QR instead of printing the full application page.

## 13. Reversals, Returns, And Refund Records

Completed sales are never deleted or edited in place. Corrections use a separate reversal record:

```text
requested -> approved -> completed
requested -> rejected
requested -> cancelled
```

- Branch managers, admins, and super-admins can create reversal requests for eligible completed sales.
- Reversals can cover all or part of a sale.
- A correction can return physical stock, leave stock out of inventory, record a refund only, correct customer credit, or document another approved correction.
- Branch managers can review, approve, or reject requests within their branch permissions.
- Only admins and super-admins complete an approved reversal.
- Completion updates stock, returned/reversed quantities, valuation, customer credit, financial transactions, and audit logs in one controlled transaction.
- Supported refund records include cash, bank transfer, POS reversal, credit note, or no refund.
- The system records and reconciles the approved refund obligation; it does not itself transfer money through an external bank or payment gateway.

## 14. Dashboards And First-Time Guidance

- Every user lands on the dashboard after sign-in.
- Dashboard content is tailored to the user's role and allowed branch scope.
- Operational users see their own work context and activity instead of protected company-wide financial summaries.
- Branch managers see branch sales, payment, release, inventory, reversal, and low-stock context.
- Admins and super-admins can view sensitive financial totals and compare branches.
- A role-specific visual onboarding guide introduces the user's main tasks on first use.
- The guide can be reopened after it has been dismissed.
- Empty, loading, success, and permission states are presented within the operational screens.

## 15. Reports And Analytics

The reporting area includes:

| Report | Purpose |
| --- | --- |
| Dashboard summary | Sales, orders, payment mix, unreleased orders, reversals, low stock, and permitted inventory value |
| Sales | Completed, pending, cancelled, expired, discounted, and reversed order performance |
| Payments | Cash, transfer, POS, credit, split-payment lines, references, cashier, and proof state |
| Inventory | Quantity position, reservations, availability, returns, damage, reorder state, and permitted valuation |
| Stock movements | Receipts, allocations, reservations, releases, adjustments, counts, and reversal movements |
| Reversals | Requests, decisions, refunds, credit corrections, and stock-return effects |
| Credit | Credit sales, reductions, customers, and outstanding balances |
| Staff activity | Audited user actions, resolved staff names, roles, branches, and affected records |
| Low stock | Products at or below their branch reorder levels |

- Branch managers can access management reports for assigned branches.
- Cashiers can access their permitted payment reporting.
- Operational staff can view limited personal activity rather than protected analytics.
- Admins and super-admins can select one branch or all branches.
- Sensitive cost, valuation, and company-wide fields are shown only to authorized administrator roles.
- Report filters and date-range limits are validated on the server.
- Large result sets are paginated.
- Authorized reports can be exported as CSV.
- Staff and customer references are displayed as names wherever those records can be resolved.

## 16. Responsive Application Experience

- Desktop uses a persistent operational sidebar.
- Tablet and mobile use a fixed bottom navigation suited to app-like use.
- When primary links fill the available width, remaining destinations move into a separate **More** sheet instead of causing horizontal scrolling.
- The More sheet opens independently above the bottom navigation.
- Role-based navigation hides workflows the user cannot perform.
- The interface uses a restrained frosted-ice visual treatment suited to the brand while keeping forms and tables readable.
- Product, order, payment, inventory, and approval workflows are usable across desktop, tablet, and mobile layouts.

## 17. Security And Data Integrity

- Firebase Authentication establishes identity.
- An active Firestore staff profile establishes application access, role, and branch assignment.
- Server-created HTTP-only session cookies protect Next.js application routes.
- Firebase App Check can protect supported production requests against unauthorized clients.
- Firestore and Storage rules restrict direct browser access by role, branch, record type, and file path.
- Sensitive mutations run through Cloud Functions or authenticated server routes.
- The browser is never trusted to decide totals, discounts, permissions, stock, payment state, or sale completion.
- Money is stored as integer kobo to avoid floating-point rounding errors.
- Transactional writes prevent partial order, payment, inventory, reversal, and valuation updates.
- Idempotency keys protect important actions from accidental duplicate submissions.
- Orders follow a server-enforced state machine.
- Stock cannot become negative, and existing reservations cannot be silently consumed.
- Completed sales and audit records are preserved rather than overwritten.
- Audit logs record the actor, role, branch, action, entity, before/after context, and time.
- Structured production logs redact sensitive values and support monitoring and incident investigation.
- Service account credentials and private keys are server-only secrets and must never be committed to the repository.

## 18. Automation And Production Operations

- A scheduled job expires eligible stale unpaid orders and releases their reservations.
- Scheduled report-summary rebuilding can be enabled for reporting performance.
- The repository includes lint, type-check, build, Cloud Function, Firebase Rules, emulator, and smoke-test commands.
- CI/CD configuration supports GitHub-based deployment using Workload Identity Federation rather than a long-lived deployment key.
- Production configuration supports Firebase App Hosting, Cloud Functions, Firestore, Storage, Authentication, and App Check.
- Deployment, monitoring, backup/recovery, smoke-test, incident-response, and release-checklist documentation is included.
- Cloud logs and alerting policies support operational monitoring.
- Backup guidance covers scheduled Firestore exports and recovery procedures.

## 19. Main Application Areas

| Area | Main routes |
| --- | --- |
| Dashboard and profile | `/dashboard`, `/profile` |
| Staff access | `/access` |
| Branch management | `/branches` |
| Catalog | `/catalog/products`, `/catalog/products/new`, `/catalog/products/[productId]`, `/catalog/branch-products` |
| Customers | `/customers`, `/customers/new`, `/customers/[customerId]` |
| Orders | `/orders`, `/orders/new`, `/orders/[orderId]`, `/orders/[orderId]/edit`, `/orders/[orderId]/slip` |
| Admin direct sale | `/orders/direct` |
| Cashier | `/cashier`, `/cashier/orders/[orderId]`, `/cashier/orders/[orderId]/receipt` |
| Release | `/release`, `/release/orders/[orderId]`, `/release/orders/[orderId]/complete` |
| Inventory | `/inventory`, `/inventory/[productId]`, receipts, adjustments, and counts |
| Reversals | `/reversals`, `/reversals/new`, `/reversals/[reversalId]`, `/orders/[orderId]/reverse` |
| Reports | `/reports` and the sales, payments, inventory, movement, reversal, credit, activity, and low-stock report routes |

## 20. Explicit System Boundaries

- YITA Iceberg records payment confirmation; it does not currently charge cards or initiate bank transfers through an external payment gateway.
- Refunds are controlled accounting and operational records; the actual movement of refund money occurs outside the application.
- Staff onboarding is invitation-only; there is no customer or public account registration.
- Product creation does not invent stock. Quantity enters through central or branch stock receipts and is then allocated or managed explicitly.
- Completed sales cannot be casually edited. Corrections must use the audited reversal workflow.
- CSV is the implemented report export format.
- The application is an internal operational system, not a public storefront or e-commerce checkout.
