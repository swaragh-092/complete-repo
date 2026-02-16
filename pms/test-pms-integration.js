const MailService = require('./services/MailService');

async function test() {
    console.log('🧪 Testing PMS MailService Integration...');

    try {
        const result = await MailService.sendMail(
            'pms-test@example.com',
            'user.welcome', 
            {
                name: 'PMS Integration User',
                email: 'pms-test@example.com'
            }
        );
        
        console.log('Result:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
}

test();
