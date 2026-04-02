#!/usr/bin/env python
"""Test script for sorting functionality."""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from werkzeug.datastructures import ImmutableMultiDict
from app.routes.questions import _parse_sort_params


def test_multiple_sort_params():
    """Test parsing multiple sort[field]=order parameters."""
    args = ImmutableMultiDict([
        ('sort[id]', 'asc'),
        ('sort[difficulty]', 'desc'),
        ('sort[created_at]', 'asc')
    ])
    result = _parse_sort_params(args)
    expected = [('id', 'asc'), ('difficulty', 'desc'), ('created_at', 'asc')]
    assert result == expected, f"Expected {expected}, got {result}"
    print("✓ Test 1 passed: Multiple sort parameters")


def test_single_sort_param():
    """Test parsing single sort[field]=order parameter."""
    args = ImmutableMultiDict([('sort[id]', 'desc')])
    result = _parse_sort_params(args)
    expected = [('id', 'desc')]
    assert result == expected, f"Expected {expected}, got {result}"
    print("✓ Test 2 passed: Single sort parameter")


def test_legacy_format():
    """Test parsing legacy sort_by + sort_order format."""
    args = ImmutableMultiDict([
        ('sort_by', 'created_at'),
        ('sort_order', 'desc')
    ])
    result = _parse_sort_params(args)
    expected = [('created_at', 'desc')]
    assert result == expected, f"Expected {expected}, got {result}"
    print("✓ Test 3 passed: Legacy format (sort_by + sort_order)")


def test_default_when_empty():
    """Test default behavior with no sort parameters."""
    args = ImmutableMultiDict([])
    result = _parse_sort_params(args)
    expected = [('id', 'asc')]
    assert result == expected, f"Expected {expected}, got {result}"
    print("✓ Test 4 passed: Default parameters (empty input)")


def test_invalid_order_values():
    """Test that invalid order values default to 'asc'."""
    args = ImmutableMultiDict([('sort[id]', 'invalid')])
    result = _parse_sort_params(args)
    # Invalid order should be ignored, falling back to default
    expected = [('id', 'asc')]
    assert result == expected, f"Expected {expected}, got {result}"
    print("✓ Test 5 passed: Invalid order value handling")


def test_case_insensitive_order():
    """Test case-insensitive order values."""
    args = ImmutableMultiDict([
        ('sort[id]', 'ASC'),
        ('sort[difficulty]', 'DESC')
    ])
    result = _parse_sort_params(args)
    expected = [('id', 'asc'), ('difficulty', 'desc')]
    assert result == expected, f"Expected {expected}, got {result}"
    print("✓ Test 6 passed: Case-insensitive order values")


def test_mixed_parameters():
    """Test that sort[...] takes precedence over legacy format."""
    args = ImmutableMultiDict([
        ('sort[difficulty]', 'desc'),
        ('sort_by', 'id'),
        ('sort_order', 'asc')
    ])
    result = _parse_sort_params(args)
    # sort[...] should take precedence
    expected = [('difficulty', 'desc')]
    assert result == expected, f"Expected {expected}, got {result}"
    print("✓ Test 7 passed: sort[...] precedence over legacy format")


def test_real_world_examples():
    """Test real-world examples from TASK.md"""
    # Example: sort[id]=asc
    args = ImmutableMultiDict([('sort[id]', 'asc')])
    result = _parse_sort_params(args)
    expected = [('id', 'asc')]
    assert result == expected, f"Expected {expected}, got {result}"
    print("✓ Test 8 passed: Real-world example (sort[id]=asc)")


def main():
    """Run all tests."""
    tests = [
        test_multiple_sort_params,
        test_single_sort_param,
        test_legacy_format,
        test_default_when_empty,
        test_invalid_order_values,
        test_case_insensitive_order,
        test_mixed_parameters,
        test_real_world_examples,
    ]
    
    print("\n" + "=" * 60)
    print("Running sorting functionality tests...")
    print("=" * 60 + "\n")
    
    failed = 0
    for test in tests:
        try:
            test()
        except AssertionError as e:
            print(f"✗ Test failed: {test.__name__}")
            print(f"  Error: {e}")
            failed += 1
        except Exception as e:
            print(f"✗ Test error: {test.__name__}")
            print(f"  Error: {e}")
            failed += 1
    
    print("\n" + "=" * 60)
    if failed == 0:
        print(f"All {len(tests)} tests passed! ✓")
    else:
        print(f"{failed}/{len(tests)} tests failed! ✗")
    print("=" * 60 + "\n")
    
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
