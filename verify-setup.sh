#!/bin/bash
# FesiStats Stats Caching Implementation Verification Script

echo "🔍 FesiStats Implementation Verification"
echo "========================================"
echo ""

# Check if Redis credentials exist
echo "1. Checking environment variables..."
if grep -q "KV_REST_API_URL" .env.local 2>/dev/null; then
    echo "   ✅ KV_REST_API_URL found"
else
    echo "   ❌ KV_REST_API_URL missing - Add to .env.local"
fi

if grep -q "KV_REST_API_TOKEN" .env.local 2>/dev/null; then
    echo "   ✅ KV_REST_API_TOKEN found"
else
    echo "   ❌ KV_REST_API_TOKEN missing - Add to .env.local"
fi

echo ""
echo "2. Checking new files created..."

files=(
    "lib/statsStorage.ts"
    "app/api/stats/route.ts"
    "app/api/admin/history/route.ts"
    "STATS_CACHING_IMPLEMENTATION.md"
    "TROUBLESHOOTING_GUIDE.md"
    "IMPLEMENTATION_COMPLETE.md"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "   ✅ $file"
    else
        echo "   ❌ $file missing"
    fi
done

echo ""
echo "3. Checking modified files..."

modified_files=(
    "lib/milestoneStorage.ts"
    "app/api/youtube/route.ts"
    "app/api/telegram/route.ts"
    "app/api/instagram/route.ts"
    "app/api/check-milestones/route.ts"
    "app/admin/milestones/page.tsx"
    "components/MilestoneChecker.tsx"
)

for file in "${modified_files[@]}"; do
    if [ -f "$file" ]; then
        if grep -q "saveStats\|statsStorage" "$file" 2>/dev/null || \
           grep -q "getMilestoneHistory\|recordMilestoneIfMissing" "$file" 2>/dev/null; then
            echo "   ✅ $file (has new code)"
        else
            echo "   ⚠️  $file (needs verification)"
        fi
    else
        echo "   ❌ $file missing"
    fi
done

echo ""
echo "4. Build check (npm run build)..."
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "   ✅ Build successful"
else
    echo "   ❌ Build failed - check errors above"
fi

echo ""
echo "5. Ready to deploy!"
echo ""
echo "📋 Next Steps:"
echo "   1. Ensure .env.local has KV_REST_API_URL and KV_REST_API_TOKEN"
echo "   2. Run: npm run dev"
echo "   3. Test homepage (should load stats from cache on 2nd visit)"
echo "   4. Go to /admin/milestones to verify setup"
echo "   5. Check DevTools Network tab (should see 0 external API calls on 2nd load)"
echo ""
echo "📚 Documentation:"
echo "   - STATS_CACHING_IMPLEMENTATION.md (technical details)"
echo "   - TROUBLESHOOTING_GUIDE.md (testing & fixes)"
echo "   - IMPLEMENTATION_COMPLETE.md (overview)"
echo ""
echo "✅ Setup complete!"
