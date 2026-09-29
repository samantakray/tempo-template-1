# Supabase Edge Functions Documentation

This document provides an overview of the Supabase Edge Functions used in the application.

## Overview

Edge Functions are server-side TypeScript/JavaScript functions that run on Supabase's edge network, close to your users. They're ideal for handling authentication, integrating with third-party services, and performing compute-intensive tasks.

## Available Edge Functions

### 1. `supabase-functions-get-plans`

**Status**: Active  
**Last Updated**: 2025-06-02

**Purpose**:
Fetches available subscription plans from the Polar payment processing service.

**Key Features**:
- Retrieves a list of non-archived products from Polar
- Returns product details including pricing and features
- Handles CORS for web access

**Endpoint**: `GET /functions/v1/supabase-functions-get-plans`

**Required Environment Variables**:
- `POLAR_ACCESS_TOKEN`: Authentication token for Polar API
- `POLAR_ORGANIZATION_ID`: Organization ID in Polar

---

### 2. `supabase-functions-payments-webhook`

**Status**: Active  
**Last Updated**: 2025-06-02

**Purpose**:
Processes webhook events from Polar for payment and subscription management.

**Key Features**:
- Handles various subscription events (created, updated, canceled)
- Updates user subscription status in the database
- Logs all webhook events for auditing
- Implements error handling and retries

**Endpoint**: `POST /functions/v1/supabase-functions-payments-webhook`

**Required Environment Variables**:
- `POLAR_ACCESS_TOKEN`: Authentication token for Polar API
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for database access

---

### 3. `supabase-functions-create-checkout`

**Status**: Active  
**Last Updated**: 2025-06-02

**Purpose**:
Creates a checkout session for users to purchase subscriptions.

**Key Features**:
- Creates a secure checkout session via Polar
- Handles customer email and metadata
- Returns session URL for redirection
- Implements CORS and error handling

**Endpoint**: `POST /functions/v1/supabase-functions-create-checkout`

**Required Environment Variables**:
- `POLAR_ACCESS_TOKEN`: Authentication token for Polar API

## Security Considerations

1. **Authentication**:
   - All functions require valid authentication tokens
   - Service role key is used for database operations

2. **CORS**:
   - Appropriate CORS headers are set for web access
   - Preflight requests are properly handled

3. **Error Handling**:
   - Comprehensive error handling is implemented
   - Sensitive information is not exposed in error responses

## Monitoring and Logging

- All functions include console logging for debugging
- Errors are logged with detailed information
- Monitor function logs in the Supabase dashboard

## Maintenance

- Keep the `@polar-sh/sdk` package updated
- Regularly review and rotate access tokens
- Monitor webhook delivery and error rates

---

*Last Updated: 2025-06-02*
