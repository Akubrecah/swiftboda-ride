import 'dotenv/config';
import { SerplyMapsClient } from '../services/maps-service/serply/client';
import { SerplyRawPlace } from '../services/maps-service/serply/types';

async function runTests() {
  console.log('🧪 ========================================================');
  console.log('🧪 RUNNING PRODUCTION SERPLY GOOGLE MAPS API TEST SUITE');
  console.log('🧪 ========================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // 1. Instantiation & Security Check
  const client = new SerplyMapsClient();
  assert(typeof client.searchPlaces === 'function', 'SerplyMapsClient initializes properly');

  // 2. Unit Test: Unicode Opening Hours Normalization
  console.log('\n--- 1. Testing Opening Hours Unicode Normalization ---');
  const rawHours = {
    Monday: '8\u202FAM\u20135\u202FPM',
    Tuesday: '9\u00A0AM\u201410\u00A0PM',
    Wednesday: 'Closed',
  };
  const normalizedHours = client.normalizeOpeningHours(rawHours);
  assert(normalizedHours !== null, 'Normalized hours is not null');
  assert(normalizedHours?.Monday === '8 AM - 5 PM', `Unicode narrow space and en-dash converted: "${normalizedHours?.Monday}"`);
  assert(normalizedHours?.Tuesday === '9 AM - 10 PM', `Non-breaking space and em-dash converted: "${normalizedHours?.Tuesday}"`);
  assert(normalizedHours?.Wednesday === 'Closed', 'String without Unicode preserved intact');

  // 3. Unit Test: Null & Optional Fields Resilience
  console.log('\n--- 2. Testing Resilience to Missing / Null Place Fields ---');
  const sparsePlace: SerplyRawPlace = {
    name: 'Minimal Boda Stop',
    latitude: -1.286389,
    longitude: 36.817223,
  };
  const normalizedSparse = client.normalizePlace(sparsePlace, 0);
  assert(normalizedSparse.name === 'Minimal Boda Stop', 'Place name resolved');
  assert(normalizedSparse.address === null, 'Missing address safely defaults to null');
  assert(normalizedSparse.phone === null, 'Missing phone safely defaults to null');
  assert(normalizedSparse.website === null, 'Missing website safely defaults to null');
  assert(normalizedSparse.rating === null, 'Missing rating safely defaults to null');
  assert(normalizedSparse.reviewCount === null, 'Missing review count safely defaults to null');
  assert(normalizedSparse.openingHours === null, 'Missing opening hours safely defaults to null');
  assert(Array.isArray(normalizedSparse.categories), 'Categories safely initialized as empty array');
  assert(normalizedSparse.id.includes('serply-place-'), 'Deterministic unique fallback ID generated');

  // 4. Unit Test: Empty Query Validation
  console.log('\n--- 3. Testing Empty Query Validation ---');
  try {
    await client.searchPlaces({ query: '' });
    assert(false, 'Empty query should reject with error');
  } catch (err: any) {
    assert(err.message.includes('Search query must not be empty'), 'Empty query rejected with informative message');
  }

  // 5. Integration Test: Live Serply Google Maps API Call
  console.log('\n--- 4. Testing Live Serply Google Maps API Call ---');
  client.clearCache();
  try {
    const liveQuery = 'coffee shops in Nairobi, Kenya';
    const liveResponse = await client.searchPlaces({
      query: liveQuery,
      num: 5,
      hl: 'en',
      gl: 'ke',
    });

    assert(liveResponse.source === 'serply', 'Source is explicitly serply');
    assert(liveResponse.resultCount > 0, `Live results received (${liveResponse.resultCount} places found)`);
    assert(liveResponse.places.length > 0, 'Places array is populated');
    assert(!liveResponse.cached, 'First live request is cached=false');

    const firstPlace = liveResponse.places[0];
    console.log(`    📍 Sample Live Place: "${firstPlace.name}"`);
    console.log(`       Address: ${firstPlace.address}`);
    console.log(`       Coords: [${firstPlace.latitude}, ${firstPlace.longitude}]`);
    console.log(`       Rating: ${firstPlace.rating ?? 'N/A'} (${firstPlace.reviewCount ?? 0} reviews)`);
    console.log(`       Categories: ${firstPlace.categories.join(', ')}`);

    assert(firstPlace.name.length > 0, 'First place has real name');
    assert(typeof firstPlace.latitude === 'number' && !isNaN(firstPlace.latitude), 'First place has valid numeric latitude');
    assert(typeof firstPlace.longitude === 'number' && !isNaN(firstPlace.longitude), 'First place has valid numeric longitude');
    assert(firstPlace.id.length > 0, 'First place has unique ID');

    // 6. Security Check: API Key Leakage
    console.log('\n--- 5. Testing Security (Zero API Key Exposure) ---');
    const serializedResponse = JSON.stringify(liveResponse);
    const configuredKey = process.env.SERPLY_API_KEY || '';
    if (configuredKey) {
      assert(!serializedResponse.includes(configuredKey), 'API Key is NOT exposed in response payload');
    }

    // 7. Caching Test (10-minute cache behavior)
    console.log('\n--- 6. Testing 10-Minute Response Caching ---');
    const cachedResponse = await client.searchPlaces({
      query: liveQuery,
      num: 5,
      hl: 'en',
      gl: 'ke',
    });
    assert(cachedResponse.cached === true, 'Subsequent identical query served directly from memory cache (cached=true)');
    assert(cachedResponse.resultCount === liveResponse.resultCount, 'Cached result count matches original');
    assert(cachedResponse.places[0].name === liveResponse.places[0].name, 'Cached place data matches original');

    // 8. Integration Test with different location
    console.log('\n--- 7. Testing Different Location Query ---');
    const eldoretResponse = await client.searchPlaces({
      query: 'hospitals in Eldoret, Kenya',
      num: 3,
    });
    assert(eldoretResponse.places.length > 0, `Eldoret query returned ${eldoretResponse.places.length} real places`);
    assert(eldoretResponse.places[0].name !== firstPlace.name, 'Different queries yield different real places');
  } catch (err: any) {
    console.error('Live API request failed:', err);
    assert(false, `Live API call failed: ${err.message}`);
  }

  console.log('\n========================================================');
  console.log(`TEST SUMMARY: ${passed} passed, ${failed} failed`);
  console.log('========================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution fatal error:', err);
  process.exit(1);
});
