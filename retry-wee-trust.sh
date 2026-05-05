#!/bin/bash

# Script to retry Wee Trust document upload for a specific screening
# Usage: ./retry-wee-trust.sh <screening_id>

SCREENING_ID="${1:-c26d73e5-ac36-4c73-a698-5b42c0556c54}"
API_URL="https://preca.admin.botia.pro"

echo "=========================================="
echo "Retrying Wee Trust Document Upload"
echo "=========================================="
echo "Screening ID: $SCREENING_ID"
echo ""

# Call your API endpoint to retry document sending
# You'll need to create this endpoint or call it manually

echo "Manual steps to retry:"
echo ""
echo "1. Go to your database and verify the screening:"
echo "   psql \"\$DATABASE_URL\" -c \"SELECT id, status, wee_trust_document_id FROM screenings WHERE id = '$SCREENING_ID';\""
echo ""
echo "2. The screening is in 'paid' status but document upload failed"
echo ""
echo "3. You need to manually trigger SendAuthorizationDocumentUseCase"
echo ""
echo "Option A: Create an admin API endpoint to retry:"
echo "   POST ${API_URL}/api/admin/screenings/${SCREENING_ID}/retry-authorization"
echo ""
echo "Option B: Update the screening to trigger webhook again:"
echo "   - The webhook handler should be idempotent"
echo "   - Manually call the Stripe webhook endpoint with the session ID"
echo ""

cat << 'EOF'

Quick Fix SQL (if you want to reset and retry):
```sql
-- This will make the screening look like it hasn't sent the document yet
-- Then you can trigger the payment webhook again
UPDATE screenings
SET wee_trust_document_id = NULL,
    authorization_document_url = NULL,
    authorization_signed_at = NULL
WHERE id = 'c26d73e5-ac36-4c73-a698-5b42c0556c54';
```

Then trigger the webhook again by calling:
```bash
curl -X POST https://preca.admin.botia.pro/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -H "stripe-signature: YOUR_SIGNATURE" \
  -d '{
    "type": "checkout.session.completed",
    "data": {
      "object": {
        "id": "cs_test_a1pE20OeieBDb7A3wkqpfBjQ3cCEg1ARsg5kId2hvhic7bQNaJmhqb8Thr"
      }
    }
  }'
```

Or better: Create an admin retry endpoint.
EOF
