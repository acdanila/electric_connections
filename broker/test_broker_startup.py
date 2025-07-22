#!/usr/bin/env python3
"""
Simple test to verify the BPM broker starts without crashing
"""

import asyncio
import time
from bpm_broker import BPMBroker

async def test_broker_startup():
    """Test that the broker can start up without crashing"""
    print("Testing BPM Broker startup...")

    broker = BPMBroker()
    print(f"✓ Broker initialized")
    print(f"✓ Plotting enabled: {broker.plotter is not None}")

    # Test that we can create a smoother
    smoother = broker.get_or_create_smoother(1)
    print(f"✓ Signal smoother created")

    # Test smoothing with some sample data
    test_values = [75, 78, 76, 82, 74, 77]
    smoothed_values = []

    for val in test_values:
        smoothed = smoother.add_sample(val)
        smoothed_values.append(smoothed)

    print(f"✓ Signal smoothing test:")
    print(f"  Raw values:      {test_values}")
    print(f"  Smoothed values: {[f'{v:.1f}' for v in smoothed_values]}")

    # Test statistics
    stats = smoother.get_statistics()
    print(f"✓ Signal statistics: mean={stats['mean']:.1f}, std={stats['std']:.1f}")

    print("\n✅ All tests passed! Broker should start correctly.")
    return True

if __name__ == "__main__":
    try:
        result = asyncio.run(test_broker_startup())
    except Exception as e:
        print(f"❌ Test failed: {e}")
        exit(1)
