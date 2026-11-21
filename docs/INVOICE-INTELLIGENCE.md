# FLOVA: Invoice Intelligence Agent

## 1. Scope & Objective
The Invoice Intelligence Agent allows tradespeople, contractors, and freelancers to manage uploaded client invoices and vendor bills. It tracks payables and receivables, records partial settlements, and reconciles payments into the transaction ledger without duplicate revenue counting.

*Note: The agent strictly manages uploaded and received invoices; it does not generate external outbound tax invoices.*

---

## 2. Database Schema & Entities

Implemented in migration `20261121000400_invoices_and_wish.sql`:

### `invoices`
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key to `auth.users`, RLS isolated)
- `invoice_number` (text)
- `kind` (`payable` | `receivable`)
- `counterparty_name` (text, e.g. client name or vendor)
- `total_amount` (numeric 12,2)
- `paid_amount` (numeric 12,2, default 0.00)
- `status` (`unpaid` | `partially_paid` | `paid` | `overdue` | `disputed` | `cancelled`)
- `issue_date` (date)
- `due_date` (date)
- `notes` (text)

### `invoice_items`
- `id` (UUID, Primary Key)
- `invoice_id` (UUID, Foreign Key to `invoices`)
- `description` (text)
- `quantity` (numeric 10,2)
- `unit_price` (numeric 12,2)
- `amount` (numeric 12,2)

### `invoice_settlements`
- `id` (UUID, Primary Key)
- `invoice_id` (UUID, Foreign Key to `invoices`)
- `transaction_id` (UUID, Foreign Key to `transactions`, optional link)
- `amount` (numeric 12,2)
- `settlement_date` (date)
- `payment_method` (text)
- `reference_note` (text)

---

## 3. Automated Reconciliation & Status Synchronization

Database triggers automatically maintain financial integrity:
1. When a record is inserted into `invoice_settlements`, `update_invoice_paid_amount()` recalculates `paid_amount = SUM(amount)`.
2. Status state machine:
   - If `paid_amount == 0.00`: `unpaid` (or `overdue` if `current_date > due_date`).
   - If `0.00 < paid_amount < total_amount`: `partially_paid`.
   - If `paid_amount >= total_amount`: `paid`.
3. **No Double-Counting:** Unpaid receivable invoices represent expected future cash flow and are excluded from the confirmed bank balance until a settlement transaction is recorded.
