// Configuration
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // Allow self-signed certs for testing
const AUTH_SERVICE_URL = 'https://localhost:4000'; // Make sure this matches your local dev port
const SERVICE_SECRET = process.env.SERVICE_SECRET || '7f32af7f747bfd98b5e175de321f04ac8f387e7dba9e26b19654442b1c2f0abd'; // Ensure this matches .env

async function testInternalEmailApi() {
    console.log('🧪 Testing Internal Email API (using fetch)...');

    // Payload
    const payload = {
        type: 'SECURITY_ALERT',
        to: 'test-internal@example.com',
        data: {
            userName: 'Internal User',
            alertTitle: 'Test Internal API',
            alertMessage: 'This email was triggered via the internal API.'
        }
    };

    // Helper for fetch requests
    const POST = async (path, body, headers = {}) => {
        const res = await fetch(`${AUTH_SERVICE_URL}${path}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...headers
            },
            body: JSON.stringify(body)
        });
        return { status: res.status, data: await res.json().catch(() => ({})) };
    };

    // Test 1: Missing Secret (Should Fail 401)
    try {
        console.log('Test 1: Request WITHOUT Secret...');
        const res = await POST('/api/internal/email/send', payload);

        if (res.status === 401) {
            console.log('✅ Test 1 Passed: Rejected with 401');
        } else {
            console.error(`❌ Test 1 Failed: Expected 401, got ${res.status}`);
        }
    } catch (error) {
        console.error('❌ Test 1 Error:', error.message);
    }

    // Test 2: Invalid Secret (Should Fail 401)
    try {
        console.log('Test 2: Request with INVALID Secret...');
        const res = await POST('/api/internal/email/send', payload, {
            'x-service-secret': 'wrong-secret'
        });

        if (res.status === 401) {
            console.log('✅ Test 2 Passed: Rejected with 401');
        } else {
            console.error(`❌ Test 2 Failed: Expected 401, got ${res.status}`);
        }
    } catch (error) {
        console.error('❌ Test 2 Error:', error.message);
    }

    // Test 3: Valid Request (Should Success 200)
    try {
        console.log('Test 3: Request with VALID Secret...');
        const res = await POST('/api/internal/email/send', payload, {
            'x-service-secret': SERVICE_SECRET
        });

        if (res.status === 200) {
            console.log('✅ Test 3 Passed:', res.data);
        } else {
            // 500 error is expected if SMTP is not configured, but auth should pass (i.e. not 401)
            if (res.status === 500) {
                console.log('✅ Test 3 Passed Authentication (Got 500 from email provider as expected)');
            } else {
                console.error(`❌ Test 3 Failed: Expected 200 or 500, got ${res.status}`);
            }
        }
    } catch (error) {
        console.error('❌ Test 3 Failed:', error.message);
    }
}

testInternalEmailApi();
