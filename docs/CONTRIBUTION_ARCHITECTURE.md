 OUT=models_dump.txt

for f in \
src/domains/cooperatives/models/legacy_models.py \
src/domains/cooperatives/models/cooperative.py \
src/domains/memberships/models.py \
src/domains/contributions/models.py \
src/domains/kyc/models.py \
src/domains/notifications/models.py \
src/domains/payments/models.py \
src/domains/wallets/models.py \
src/domains/users/models.py \
src/domains/insights/models.py \
src/domains/analytics/models.py \
src/domains/support/models.py \
src/domains/ai_chat/models.py
do
    {
        echo
        echo "================================================================================"
        echo "FILE: $f"
        echo "================================================================================"
        cat "$f"
    } >> "$OUT"
done

echo "Written to $OUT"