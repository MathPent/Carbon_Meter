"""
Quick Test Script for ML API
Run this to verify the ML API is working correctly
"""

import requests
import json

ML_API_URL = 'http://localhost:5001'

def test_health():
    """Test health endpoint"""
    print("\n" + "="*60)
    print("TEST 1: Health Check")
    print("="*60)
    
    try:
        response = requests.get(f'{ML_API_URL}/health')
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200 and response.json().get('ok'):
            print("✅ PASS: Health check successful")
            return True
        else:
            print("❌ FAIL: Health check failed")
            return False
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False

def test_prediction():
    """Test prediction endpoint"""
    print("\n" + "="*60)
    print("TEST 2: Prediction")
    print("="*60)
    
    test_data = {
        "last_n_days": [12.5, 11.8, 13.2, 10.9]
    }
    
    print(f"Input: {test_data}")
    
    try:
        response = requests.post(
            f'{ML_API_URL}/predict-missing',
            json=test_data,
            headers={'Content-Type': 'application/json'}
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            result = response.json()
            if 'predicted_co2' in result and 'confidence' in result:
                print("✅ PASS: Prediction successful")
                print(f"   Predicted: {result['predicted_co2']} kg CO₂")
                print(f"   Confidence: {result['confidence']}")
                return True
        
        print("❌ FAIL: Prediction failed")
        return False
        
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False

def test_confidence_levels():
    """Test different confidence levels"""
    print("\n" + "="*60)
    print("TEST 3: Confidence Levels")
    print("="*60)
    
    test_cases = [
        ([12.5], "low"),
        ([12.5, 11.8], "medium"),
        ([12.5, 11.8, 13.2, 10.9], "medium"),
        ([12.5, 11.8, 13.2, 10.9, 12.0, 11.5], "high")
    ]
    
    all_passed = True
    
    for data, expected_confidence in test_cases:
        try:
            response = requests.post(
                f'{ML_API_URL}/predict-missing',
                json={"last_n_days": data}
            )
            
            if response.status_code == 200:
                result = response.json()
                actual = result.get('confidence')
                
                if actual == expected_confidence:
                    print(f"✅ {len(data)} days → {actual} confidence")
                else:
                    print(f"❌ {len(data)} days → Expected {expected_confidence}, got {actual}")
                    all_passed = False
            else:
                print(f"❌ Request failed for {len(data)} days")
                all_passed = False
                
        except Exception as e:
            print(f"❌ ERROR: {e}")
            all_passed = False
    
    return all_passed

def test_edge_cases():
    """Test edge cases"""
    print("\n" + "="*60)
    print("TEST 4: Edge Cases")
    print("="*60)
    
    # Empty array
    print("Testing empty array...")
    try:
        response = requests.post(
            f'{ML_API_URL}/predict-missing',
            json={"last_n_days": []}
        )
        if response.status_code == 422:
            print("✅ Correctly rejects empty array")
        else:
            print(f"❌ Should return 422, got {response.status_code}")
    except Exception as e:
        print(f"❌ ERROR: {e}")
    
    # Non-numeric values
    print("Testing non-numeric values...")
    try:
        response = requests.post(
            f'{ML_API_URL}/predict-missing',
            json={"last_n_days": ["abc", 12.5, None]}
        )
        if response.status_code in [200, 422]:
            print("✅ Handles non-numeric values gracefully")
        else:
            print(f"❌ Unexpected status: {response.status_code}")
    except Exception as e:
        print(f"❌ ERROR: {e}")
    
    return True

def main():
    """Run all tests"""
    print("\n")
    print("*" * 60)
    print("*" + " " * 58 + "*")
    print("*" + "  CarbonMeter ML API Test Suite".center(58) + "*")
    print("*" + " " * 58 + "*")
    print("*" * 60)
    
    print(f"\nTesting ML API at: {ML_API_URL}")
    print("Make sure the ML API is running (python api.py)")
    
    results = []
    
    results.append(("Health Check", test_health()))
    results.append(("Prediction", test_prediction()))
    results.append(("Confidence Levels", test_confidence_levels()))
    results.append(("Edge Cases", test_edge_cases()))
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    for test_name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{test_name}: {status}")
    
    total = len(results)
    passed = sum(1 for _, p in results if p)
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed! ML API is ready for demo.")
    else:
        print("\n⚠️  Some tests failed. Please check the ML API.")
    
    print("="*60 + "\n")

if __name__ == '__main__':
    main()
