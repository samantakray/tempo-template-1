# Supabase Tables Documentation

This document provides detailed information about the database tables, their schemas, and Row Level Security (RLS) policies in the Supabase project.

## Table of Contents
- [Users](#users)
- [Subscriptions](#subscriptions)
- [Webhook Events](#webhook-events)
- [Database Relationships](#database-relationships)
- [Row Level Security (RLS) Summary](#row-level-security-rls-summary)

## Users

**Table Name**: `public.users`

### Schema
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | | Primary key |
| avatar_url | text | YES | | URL to user's avatar |
| user_id | text | YES | | User identifier (matches auth.users.id) |
| token_identifier | text | NO | | Authentication token identifier |
| subscription | text | YES | | User's subscription status |
| credits | text | YES | | User's available credits |
| image | text | YES | | User's profile image |
| created_at | timestamptz | NO | timezone('utc'::text, now()) | Record creation timestamp |
| updated_at | timestamptz | YES | | Last update timestamp |
| email | text | YES | | User's email address |
| name | text | YES | | User's display name |
| full_name | text | YES | | User's full name |

### RLS Policies
1. **Users can view own data**
   - **Type**: SELECT
   - **Roles**: public
   - **Expression**: `auth.uid()::text = user_id`
   - **Description**: Users can only see their own data

2. **Service role can insert users**
   - **Type**: INSERT
   - **Roles**: authenticated, service_role
   - **Expression**: No restriction
   - **Description**: Only authenticated users and service roles can insert records

3. **Service role can update users**
   - **Type**: UPDATE
   - **Roles**: authenticated, service_role
   - **Expression**: No restriction
   - **Description**: Only authenticated users and service roles can update records

---

## Subscriptions

**Table Name**: `public.subscriptions`

### Schema
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| user_id | text | YES | | Foreign key to users.user_id |
| polar_id | text | YES | | Polar subscription ID |
| polar_price_id | text | YES | | Polar price plan ID |
| currency | text | YES | | Subscription currency |
| interval | text | YES | | Billing interval (monthly, yearly, etc.) |
| status | text | YES | | Subscription status |
| current_period_start | bigint | YES | | Start of current billing period |
| current_period_end | bigint | YES | | End of current billing period |
| cancel_at_period_end | boolean | YES | | Whether subscription will cancel at period end |
| amount | bigint | YES | | Subscription amount in smallest currency unit |
| started_at | bigint | YES | | When the subscription started |
| ended_at | bigint | YES | | When the subscription ended |
| canceled_at | bigint | YES | | When the subscription was canceled |
| customer_cancellation_reason | text | YES | | Reason for cancellation |
| customer_cancellation_comment | text | YES | | Additional cancellation comments |
| metadata | jsonb | YES | | Additional subscription metadata |
| custom_field_data | jsonb | YES | | Custom field data |
| customer_id | text | YES | | Customer ID in payment processor |
| created_at | timestamptz | NO | timezone('utc'::text, now()) | Record creation timestamp |
| updated_at | timestamptz | NO | timezone('utc'::text, now()) | Last update timestamp |

### RLS Policies
1. **Users can view own subscriptions**
   - **Type**: SELECT
   - **Roles**: public
   - **Expression**: `auth.uid()::text = user_id`
   - **Description**: Users can only see their own subscriptions

---

## Webhook Events

**Table Name**: `public.webhook_events`

### Schema
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| event_type | text | NO | | Type of webhook event |
| type | text | NO | | Event category |
| polar_event_id | text | YES | | ID from Polar |
| data | jsonb | YES | | Event payload |
| created_at | timestamptz | NO | timezone('utc'::text, now()) | Record creation timestamp |
| modified_at | timestamptz | NO | timezone('utc'::text, now()) | Last modification timestamp |
| error | text | YES | | Error details if processing failed |

### RLS Policies
- **RLS is enabled** but no specific policies are defined
- **Note**: This means all operations are denied by default for all roles

---

## Database Relationships

1. **users** (1) → (many) **subscriptions**
   - `subscriptions.user_id` references `users.user_id`
   - One user can have multiple subscriptions

## Row Level Security (RLS) Summary

| Table | RLS Enabled | Policies |
|-------|-------------|----------|
| users | Yes | - Users can view own data (SELECT, public)<br>- Service role can insert users (INSERT, authenticated/service_role)<br>- Service role can update users (UPDATE, authenticated/service_role) |
| subscriptions | Yes | - Users can view own subscriptions (SELECT, public) |
| webhook_events | Yes | No policies defined (all operations denied by default) |

## Recommendations

1. **webhook_events Table**:
   - Add appropriate RLS policies or disable RLS if not needed
   - Consider who should have read/write access to webhook events

2. **subscriptions Table**:
   - Consider adding INSERT/UPDATE policies if needed
   - Add DELETE policy if required

3. **users Table**:
   - Consider adding a DELETE policy if user deletion is required
   - Review if public SELECT access is appropriate for your security model

4. **General**:
   - Regularly review and test RLS policies
   - Consider using service roles for server-side operations
   - Document any future schema changes

---

*Last Updated: 2025-06-02*
