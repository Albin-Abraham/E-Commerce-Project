#!/bin/bash

# Test Runner Script
# Usage: ./scripts/test/run-tests.sh [options]

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Default options
COVERAGE=false
WATCH=false
UPDATE_SNAPSHOTS=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --coverage)
            COVERAGE=true
            shift
            ;;
        --watch)
            WATCH=true
            shift
            ;;
        --update-snapshots)
            UPDATE_SNAPSHOTS=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Running Test Suite${NC}"
echo -e "${GREEN}========================================${NC}"

# Build test command
TEST_CMD="npm test --"

if [ "$WATCH" = true ]; then
    TEST_CMD="$TEST_CMD --watch"
else
    TEST_CMD="$TEST_CMD --run"
fi

if [ "$COVERAGE" = true ]; then
    TEST_CMD="$TEST_CMD --coverage"
fi

if [ "$UPDATE_SNAPSHOTS" = true ]; then
    TEST_CMD="$TEST_CMD --update"
fi

echo -e "\n${YELLOW}Running: $TEST_CMD${NC}\n"

# Run tests
eval $TEST_CMD

# Check coverage thresholds if coverage was run
if [ "$COVERAGE" = true ]; then
    echo -e "\n${GREEN}Coverage report generated in coverage/index.html${NC}"
    
    # Optional: Check minimum coverage
    COVERAGE_PERCENT=$(grep -oP 'All files.*?\K\d+\.\d+' coverage/coverage-summary.json | head -1 || echo "0")
    MIN_COVERAGE=80
    
    if (( $(echo "$COVERAGE_PERCENT < $MIN_COVERAGE" | bc -l) )); then
        echo -e "${RED}Warning: Coverage ($COVERAGE_PERCENT%) is below minimum ($MIN_COVERAGE%)${NC}"
        exit 1
    else
        echo -e "${GREEN}✓ Coverage ($COVERAGE_PERCENT%) meets minimum requirement${NC}"
    fi
fi

echo -e "\n${GREEN}✓ All tests passed!${NC}"
